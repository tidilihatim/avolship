import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SystemLog from '@/lib/db/models/system-log';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's counts
    const [todayStats, yesterdayStats, topIssues, performanceData] = await Promise.all([
      // Today's stats
      SystemLog.aggregate([
        {
          $match: {
            timestamp: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Yesterday's stats for comparison
      SystemLog.aggregate([
        {
          $match: {
            timestamp: { $gte: yesterday, $lt: today }
          }
        },
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Top issues by category
      SystemLog.aggregate([
        {
          $match: {
            timestamp: { $gte: today, $lt: tomorrow },
            level: { $in: ['error', 'warn'] }
          }
        },
        {
          $group: {
            _id: {
              category: '$category',
              level: '$level'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Performance metrics
      SystemLog.aggregate([
        {
          $match: {
            timestamp: { $gte: today, $lt: tomorrow },
            category: 'performance',
            'metadata.duration': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$metadata.duration' },
            slowQueries: {
              $sum: {
                $cond: [{ $gt: ['$metadata.duration', 1000] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    // Process the results
    const todayLevels = todayStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    const yesterdayLevels = yesterdayStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate critical operations
    const criticalOps = await SystemLog.countDocuments({
      timestamp: { $gte: today, $lt: tomorrow },
      action: { $in: ['ORDER_STATUS_CHANGE', 'PAYMENT_RECEIVED', 'REFUND_PROCESSED'] }
    });

    // Calculate percentage changes
    const errorChange = yesterdayLevels.error 
      ? ((todayLevels.error || 0) - yesterdayLevels.error) / yesterdayLevels.error * 100
      : 0;
      
    const warningChange = yesterdayLevels.warn
      ? ((todayLevels.warn || 0) - yesterdayLevels.warn) / yesterdayLevels.warn * 100
      : 0;

    return NextResponse.json({
      today: {
        errors: todayLevels.error || 0,
        warnings: todayLevels.warn || 0,
        info: todayLevels.info || 0,
        criticalOps,
      },
      comparison: {
        errors: Math.round(errorChange),
        warnings: Math.round(warningChange),
      },
      topIssues: topIssues.map(issue => ({
        category: issue._id.category,
        count: issue.count,
        level: issue._id.level,
      })),
      performance: {
        slowQueries: performanceData[0]?.slowQueries || 0,
        avgResponseTime: Math.round(performanceData[0]?.avgDuration || 0),
      },
    });

  } catch (error) {
    console.error('Error fetching log stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log statistics' },
      { status: 500 }
    );
  }
}
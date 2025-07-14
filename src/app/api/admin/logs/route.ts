import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SystemLog, { LogLevel, LogCategory } from '@/lib/db/models/system-log';
import { UserRole } from '@/lib/db/models/user';
import { withApiLogging } from '@/lib/logging/api-logger';

async function handler(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
      // Parse query parameters
      const searchParams = req.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const level = searchParams.get('level') as LogLevel | undefined;
      const category = searchParams.get('category') as LogCategory | undefined;
      const userId = searchParams.get('userId');
      const search = searchParams.get('search');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const resolved = searchParams.get('resolved');

      // Build query
      const query: any = {};
      
      if (level && level !== 'all') query.level = level;
      if (category && category !== 'all') query.category = category;
      if (userId) query.userId = userId;
      if (resolved && resolved !== 'all') query.resolved = resolved === 'true';
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      if (search) {
        query.$text = { $search: search };
      }

      // Execute query with pagination
      const [logs, total] = await Promise.all([
        SystemLog.find(query)
          .sort({ timestamp: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('userId', 'name email role')
          .populate('resolvedBy', 'name email')
          .lean(),
        SystemLog.countDocuments(query),
      ]);

      // Get aggregated stats
      const [errorStats, performanceStats] = await Promise.all([
        SystemLog.getErrorStats(7),
        SystemLog.getPerformanceStats(7),
      ]);

      return NextResponse.json({
        success: true,
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          errors: errorStats,
          performance: performanceStats,
        },
      });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    );
  }
}

// Export without the logging wrapper for now to avoid response body consumption issues
export const GET = handler;
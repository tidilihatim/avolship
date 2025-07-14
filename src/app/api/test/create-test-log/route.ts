import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SystemLog, { LogLevel, LogCategory } from '@/lib/db/models/system-log';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Create a test log directly in the database
    const testLog = await SystemLog.create({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.API_ERROR,
      message: 'Direct test log - This is a test error message created directly in the database',
      userId: session.user.id,
      userRole: session.user.role,
      userEmail: session.user.email,
      action: 'TEST_LOG_CREATION',
      metadata: {
        test: true,
        createdBy: 'test-endpoint',
        timestamp: new Date().toISOString(),
      },
      resolved: false,
    });

    // Also create a few more logs with different levels
    const additionalLogs = await SystemLog.create([
      {
        timestamp: new Date(),
        level: LogLevel.WARN,
        category: LogCategory.PERFORMANCE_ISSUE,
        message: 'Test performance warning - Slow query detected',
        userId: session.user.id,
        userRole: session.user.role,
        duration: 3500,
        metadata: { query: 'SELECT * FROM orders', time: '3.5s' },
        resolved: false,
      },
      {
        timestamp: new Date(),
        level: LogLevel.INFO,
        category: LogCategory.USER_ACTION,
        message: 'Test user action - User exported data',
        userId: session.user.id,
        userRole: session.user.role,
        action: 'EXPORT_DATA',
        metadata: { format: 'CSV', records: 100 },
        resolved: false,
      }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Test logs created directly in database',
      logsCreated: 3,
      firstLogId: testLog._id,
    });

  } catch (error: any) {
    console.error('Error creating test log:', error);
    return NextResponse.json(
      { error: 'Failed to create test log', details: error.message },
      { status: 500 }
    );
  }
}
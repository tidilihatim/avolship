import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import SystemLog from '@/lib/db/models/system-log';

export async function POST(req: NextRequest) {
  try {
    // Check for internal API key (simple security for batch operations)
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.INTERNAL_API_KEY || 'internal-key';
    
    if (apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { logs } = await req.json();

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ error: 'No logs provided' }, { status: 400 });
    }

    // Insert logs in batch
    const result = await SystemLog.insertMany(logs, { ordered: false });

    return NextResponse.json({
      success: true,
      inserted: result.length,
      message: `Successfully inserted ${result.length} logs`,
    });

  } catch (error: any) {
    console.error('Error saving batch logs:', error);
    
    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'Some logs were duplicates',
        details: error.message,
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to save logs', details: error.message },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';

export async function GET() {
  try {
    const conn = await connectToDatabase();

    return NextResponse.json({
      status: 'success',
      message: 'Database connected successfully',
      readyState: conn.readyState,
      host: conn.host,
      name: conn.name,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to connect to database',
      },
      { status: 500 }
    );
  }
}

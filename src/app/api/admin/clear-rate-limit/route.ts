import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { clearRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Clear all rate limits
    clearRateLimit();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rate limits cleared' 
    });
    
  } catch (error) {
    console.error('Error clearing rate limits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({ 
    message: 'POST to this endpoint to clear rate limits',
    environment: process.env.NODE_ENV || 'not set'
  });
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import { UserRole } from '@/lib/db/models/user';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    // Test database connection
    await connectToDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      session: {
        user: session.user.email,
        role: session.user.role
      }
    });
    
  } catch (error) {
    console.error('Test simple error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
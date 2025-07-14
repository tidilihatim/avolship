import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import User from '@/lib/db/models/user';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.role);
    
    if (!session?.user || !['ADMIN', 'MODERATOR', 'admin', 'moderator'].includes(session.user.role)) {
      console.log('Unauthorized: role is', session?.user?.role);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    
    console.log('Query params:', { role, status });
    
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }
    
    console.log('MongoDB query:', query);
    
    const users = await User.find(query)
      .select('name email role status businessName createdAt')
      .sort({ createdAt: -1 });
    
    console.log('Found users:', users.length);
    
    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users' 
    }, { status: 500 });
  }
}
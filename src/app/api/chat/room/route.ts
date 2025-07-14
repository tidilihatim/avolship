import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const body = await req.json();
    const { sellerId, providerId } = body;
    
    // Generate JWT token for backend
    const tokenResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/token`, {
      method: 'GET',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });
    
    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to generate auth token' }, { status: 500 });
    }
    
    const { token } = await tokenResponse.json();
    
    // Forward request to backend
    const backendUrl = process.env.SOCKET_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${backendUrl}/api/chat/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        sellerId,
        providerId,
      }),
    });
    
    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create chat room' }, 
        { status: backendResponse.status }
      );
    }
    
    const data = await backendResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
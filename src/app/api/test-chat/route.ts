import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get JWT token
    const tokenResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/token`, {
      headers: {
        'Cookie': req.headers.get('cookie') || ''
      }
    });
    
    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
    }
    
    const { token } = await tokenResponse.json();
    
    // Test chat room creation
    const chatResponse = await fetch('http://localhost:3001/api/chat/room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sellerId: session.user.id,
        providerId: 'test-provider-id'
      })
    });
    
    const chatData = await chatResponse.text();
    
    return NextResponse.json({
      tokenReceived: !!token,
      tokenLength: token?.length || 0,
      chatStatus: chatResponse.status,
      chatResponse: chatData,
      sessionUser: {
        id: session.user.id,
        role: session.user.role
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
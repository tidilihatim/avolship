import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { getAccessToken } from '@/app/actions/cookie';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatRoomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { chatRoomId } = await params;
    const body = await req.json();
    const { messageType, content, replyTo } = body;
    
    // Get JWT token for backend authentication
    const jwtToken = await getAccessToken();
    if (!jwtToken) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 401 });
    }
    
    // Forward request to backend
    const backendUrl = process.env.SOCKET_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${backendUrl}/api/chat/${chatRoomId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        messageType,
        content,
        replyTo,
      }),
    });
    
    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send message' }, 
        { status: backendResponse.status }
      );
    }
    
    const data = await backendResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
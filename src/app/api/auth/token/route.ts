import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { SignJWT } from 'jose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Create a JWT token for the backend - must match backend exactly
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const secret = new TextEncoder().encode(jwtSecret);
    
    const token = await new SignJWT({
      sub: session.user.id,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(secret);
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ 
      error: 'Failed to generate token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Delete NextAuth session cookies
    cookieStore.set('next-auth.session-token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });
    
    cookieStore.set('next-auth.csrf-token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });
    
    // Also try to delete secure versions
    cookieStore.set('__Secure-next-auth.session-token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 0,
      path: '/',
    });
    
    cookieStore.set('__Secure-next-auth.csrf-token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 0,
      path: '/',
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}
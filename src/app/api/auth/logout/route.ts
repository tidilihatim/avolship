import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Get all cookies
    const cookieStore = await cookies();
    
    // Clear all auth-related cookies
    const authCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
    ];
    
    // Delete each auth cookie
    authCookies.forEach(cookieName => {
      cookieStore.delete({
        name: cookieName,
        path: '/',
      });
    });
    
    // Return success response with redirect
    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { 
        status: 200,
        headers: {
          'Set-Cookie': authCookies.map(name => 
            `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
          ).join(', ')
        }
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
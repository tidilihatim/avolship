import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    // Get cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Get specific auth cookies
    const authCookies = allCookies.filter(c => 
      c.name.includes('next-auth') || c.name.includes('session')
    );
    
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        }
      } : null,
      authCookies: authCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        length: c.value?.length || 0
      })),
      allCookieNames: allCookies.map(c => c.name)
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
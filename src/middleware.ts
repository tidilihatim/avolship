import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authRateLimit, apiRateLimit, webhookRateLimit } from '@/lib/rate-limit';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check authentication for dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token && !pathname.includes('/auth/')) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  // Check authentication for test-logout page
  if (pathname.startsWith('/test-logout')) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  // Apply rate limiting based on route
  let rateLimitResult = { allowed: true, message: '' };
  
  if (pathname.startsWith('/api/auth/')) {
    // Stricter rate limiting for auth endpoints
    rateLimitResult = await authRateLimit(request);
  } else if (pathname.startsWith('/api/webhooks/')) {
    // Webhook-specific rate limiting
    rateLimitResult = await webhookRateLimit(request);
  } else if (pathname.startsWith('/api/')) {
    // General API rate limiting
    rateLimitResult = await apiRateLimit(request);
  }
  
  // If rate limit exceeded, return 429
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: rateLimitResult.message },
      { 
        status: 429,
        headers: {
          'Retry-After': '60', // Suggest retry after 60 seconds
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*', // Also protect dashboard routes
    '/test-logout', // Protect test-logout page
  ]
};
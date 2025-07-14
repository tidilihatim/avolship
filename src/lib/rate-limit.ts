import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (consider using Redis in production)
const store: RateLimitStore = {};

// Function to clear rate limit for a specific key (development only)
export function clearRateLimit(key?: string) {
  if (process.env.NODE_ENV === 'development') {
    if (key) {
      delete store[key];
    } else {
      // Clear all rate limits
      Object.keys(store).forEach(k => delete store[k]);
    }
  }
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: NextRequest) => string;
}

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests default
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => {
      // Default key generator uses IP address
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      return ip;
    }
  } = config;

  return async (req: NextRequest): Promise<{ allowed: boolean; message?: string }> => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create rate limit data for this key
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    // Increment count
    store[key].count++;
    
    // Check if limit exceeded
    if (store[key].count > max) {
      return {
        allowed: false,
        message
      };
    }
    
    return { allowed: true };
  };
}

// Pre-configured rate limiters for different endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 5, // 500 attempts in dev, 5 in production
  message: 'Too many login attempts, please try again after 15 minutes.',
  keyGenerator: (req) => {
    // In development, use a more specific key to avoid grouping all requests
    if (process.env.NODE_ENV === 'development') {
      const sessionId = req.cookies.get('next-auth.session-token')?.value || 
                       req.cookies.get('__Secure-next-auth.session-token')?.value || 
                       Math.random().toString();
      return `dev-auth-${sessionId}`;
    }
    // Production: use IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 600 : 60, // 600 requests per minute in dev, 60 in production
  message: 'API rate limit exceeded, please slow down.',
  keyGenerator: (req) => {
    // In development, use URL path + session to avoid grouping all requests
    if (process.env.NODE_ENV === 'development') {
      const path = req.nextUrl.pathname;
      const sessionId = req.cookies.get('next-auth.session-token')?.value || 
                       req.cookies.get('__Secure-next-auth.session-token')?.value || 
                       'anonymous';
      return `dev-api-${path}-${sessionId}`;
    }
    // Production: use IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
  }
});

export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 webhook calls per minute
  keyGenerator: (req) => {
    // Use webhook source as key
    const source = req.headers.get('x-webhook-source') || 'unknown';
    return `webhook:${source}`;
  }
});
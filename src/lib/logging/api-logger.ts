import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { logger, LogCategory, LogLevel } from './logger';

interface ApiLogMetadata {
  startTime: number;
  endTime?: number;
  duration?: number;
  user?: {
    id: string;
    role: string;
    email: string;
  };
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    query?: any;
  };
  response?: {
    statusCode: number;
    body?: any;
  };
  error?: any;
}

// List of sensitive headers to exclude from logs
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

// List of sensitive fields to mask in request/response bodies
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv'];

function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  headers.forEach((value, key) => {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}

function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item));
  }
  
  const masked: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

export async function withApiLogging(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    skipLogging?: boolean;
    logLevel?: LogLevel;
    category?: LogCategory;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (options?.skipLogging) {
      return handler(req);
    }

    const metadata: ApiLogMetadata = {
      startTime: Date.now(),
      request: {
        url: req.url,
        method: req.method,
        headers: sanitizeHeaders(req.headers),
      },
    };

    // Try to get request body (if JSON)
    try {
      const contentType = req.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const body = await req.json();
        metadata.request.body = maskSensitiveData(body);
        
        // Recreate request with consumed body
        req = new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(body),
        });
      }
    } catch (error) {
      // Ignore body parsing errors
    }

    // Get user session
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        metadata.user = {
          id: session.user.id,
          role: session.user.role,
          email: session.user.email,
        };
      }
    } catch (error) {
      // Ignore session errors
    }

    try {
      // Call the actual handler
      const response = await handler(req);
      
      // Log response
      metadata.endTime = Date.now();
      metadata.duration = metadata.endTime - metadata.startTime;
      metadata.response = {
        statusCode: response.status,
      };

      // Try to get response body (if JSON)
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json') && response.body) {
          const body = await response.json();
          metadata.response.body = maskSensitiveData(body);
          
          // Recreate response with consumed body
          return NextResponse.json(body, {
            status: response.status,
            headers: response.headers,
          });
        }
      } catch (error) {
        // Ignore body parsing errors
      }

      // Log based on status code
      if (response.status >= 500) {
        await logger.error(`API Error: ${req.method} ${req.url}`, undefined, {
          category: LogCategory.API_ERROR,
          ...metadata,
          statusCode: response.status,
        });
      } else if (response.status >= 400) {
        await logger.warn(`API Client Error: ${req.method} ${req.url}`, {
          category: LogCategory.API_ERROR,
          ...metadata,
          statusCode: response.status,
        });
      } else if (metadata.duration && metadata.duration > 3000) {
        // Log slow requests
        await logger.logPerformanceIssue(
          `${req.method} ${req.url}`,
          metadata.duration,
          3000,
          metadata
        );
      }

      return response;
    } catch (error: any) {
      // Log error
      metadata.endTime = Date.now();
      metadata.duration = metadata.endTime - metadata.startTime;
      metadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };

      await logger.logApiError(
        error,
        {
          url: req.url,
          method: req.method,
          headers: req.headers,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        },
        metadata.user,
        500
      );

      // Return error response
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
          requestId: `${metadata.startTime}`,
        },
        { status: 500 }
      );
    }
  };
}

// Middleware for critical operations logging
export async function logCriticalOperation(
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: any
) {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    await logger.logCriticalOperation(
      action,
      {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email,
      },
      resourceType,
      resourceId,
      metadata
    );
  }
}

// Performance monitoring wrapper
export async function withPerformanceLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  threshold: number = 1000
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    await logger.logPerformanceIssue(operation, duration, threshold);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    await logger.error(`Performance operation failed: ${operation}`, error as Error, {
      category: LogCategory.PERFORMANCE_ISSUE,
      duration,
      metadata: { threshold },
    });
    
    throw error;
  }
}
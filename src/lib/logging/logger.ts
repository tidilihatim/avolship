import { cache } from '@/lib/redis';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export enum LogCategory {
  API_ERROR = 'api_error',
  AUTH_ERROR = 'auth_error',
  DATABASE_ERROR = 'database_error',
  VALIDATION_ERROR = 'validation_error',
  PAYMENT_ERROR = 'payment_error',
  CRITICAL_OPERATION = 'critical_operation',
  SECURITY_EVENT = 'security_event',
  PERFORMANCE_ISSUE = 'performance_issue',
  USER_ACTION = 'user_action',
  SYSTEM_ERROR = 'system_error',
}

export interface LogEntry {
  id?: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
  fingerprint?: string; // For grouping similar errors
}

export interface LogFilter {
  level?: LogLevel;
  category?: LogCategory;
  userId?: string;
  userRole?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  resourceType?: string;
  hasError?: boolean;
}

class Logger {
  private static instance: Logger;
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private maxBufferSize = 50;
  private flushIntervalMs = 5000; // 5 seconds

  private constructor() {
    // Start the flush interval
    this.startFlushInterval();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      // Import dynamically to avoid circular dependencies
      const { default: SystemLog } = await import('@/lib/db/models/system-log');
      const { connectToDatabase } = await import('@/lib/db/mongoose');
      
      // Ensure database connection
      await connectToDatabase();
      
      // Insert logs directly to database
      await SystemLog.insertMany(logsToFlush, { ordered: false });
      
      console.log(`Successfully flushed ${logsToFlush.length} logs to database`);
    } catch (error) {
      console.error('Error flushing logs:', error);
      // Put logs back in buffer if failed
      this.buffer.unshift(...logsToFlush);
    }
  }

  private generateFingerprint(error: Error): string {
    // Generate a fingerprint for grouping similar errors
    const key = `${error.name}-${error.message}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private async log(entry: Omit<LogEntry, 'timestamp' | 'id'>): Promise<void> {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Add to buffer
    this.buffer.push(logEntry);

    // Flush immediately if buffer is full or if it's a critical error
    if (this.buffer.length >= this.maxBufferSize || 
        entry.level === LogLevel.ERROR ||
        entry.category === LogCategory.CRITICAL_OPERATION ||
        entry.category === LogCategory.SECURITY_EVENT) {
      await this.flush();
    }

    // For critical errors, also update a real-time counter in Redis (if available)
    if (entry.level === LogLevel.ERROR && cache) {
      try {
        const errorKey = `errors:count:${new Date().toISOString().split('T')[0]}`;
        await cache.incr(errorKey, 1);
      } catch (redisError) {
        // Ignore Redis errors
      }
    }
  }

  async error(
    message: string,
    error?: Error | any,
    metadata?: Partial<LogEntry>
  ): Promise<void> {
    const errorInfo = error ? {
      name: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack,
      code: error.code,
    } : undefined;

    await this.log({
      level: LogLevel.ERROR,
      category: metadata?.category || LogCategory.SYSTEM_ERROR,
      message,
      error: errorInfo,
      fingerprint: error ? this.generateFingerprint(error) : undefined,
      ...metadata,
    });
  }

  async warn(message: string, metadata?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: LogLevel.WARN,
      category: metadata?.category || LogCategory.SYSTEM_ERROR,
      message,
      ...metadata,
    });
  }

  async info(message: string, metadata?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      category: metadata?.category || LogCategory.USER_ACTION,
      message,
      ...metadata,
    });
  }

  async debug(message: string, metadata?: Partial<LogEntry>): Promise<void> {
    if (process.env.NODE_ENV === 'production') return; // Skip debug logs in production
    
    await this.log({
      level: LogLevel.DEBUG,
      category: metadata?.category || LogCategory.SYSTEM_ERROR,
      message,
      ...metadata,
    });
  }

  async logApiError(
    error: Error,
    req: {
      url?: string;
      method?: string;
      headers?: any;
      ip?: string;
    },
    user?: {
      id: string;
      role: string;
      email: string;
    },
    statusCode?: number
  ): Promise<void> {
    await this.error('API Error', error, {
      category: LogCategory.API_ERROR,
      userId: user?.id,
      userRole: user?.role,
      userEmail: user?.email,
      url: req.url,
      method: req.method,
      ip: req.ip || req.headers?.['x-forwarded-for'],
      userAgent: req.headers?.['user-agent'],
      statusCode,
    });
  }

  async logCriticalOperation(
    action: string,
    user: {
      id: string;
      role: string;
      email: string;
    },
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.info(`Critical operation: ${action}`, {
      category: LogCategory.CRITICAL_OPERATION,
      userId: user.id,
      userRole: user.role,
      userEmail: user.email,
      action,
      resourceType,
      resourceId,
      metadata,
    });
  }

  async logSecurityEvent(
    event: string,
    severity: LogLevel,
    details: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: severity,
      category: LogCategory.SECURITY_EVENT,
      message: `Security event: ${event}`,
      metadata: details,
    });
  }

  async logPerformanceIssue(
    operation: string,
    duration: number,
    threshold: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (duration > threshold) {
      await this.warn(`Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`, {
        category: LogCategory.PERFORMANCE_ISSUE,
        duration,
        metadata: {
          ...metadata,
          threshold,
          exceededBy: duration - threshold,
        },
      });
    }
  }

  // Force flush all pending logs
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  // Clean up resources
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Ensure logs are flushed on process exit
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.forceFlush();
  });
} else {
  process.on('exit', () => {
    logger.destroy();
  });
}
import { NextRequest } from 'next/server';
import { logger, LogCategory } from '../logger';

interface PerformanceThresholds {
  api: number; // milliseconds
  database: number;
  external: number;
}

const THRESHOLDS: PerformanceThresholds = {
  api: 1000, // 1 second
  database: 500, // 500ms
  external: 3000, // 3 seconds
};

export class PerformanceLogger {
  private static instance: PerformanceLogger;
  private activeOperations: Map<string, { startTime: number; metadata: any }> = new Map();

  static getInstance(): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger();
    }
    return PerformanceLogger.instance;
  }

  startOperation(operationId: string, type: string, metadata?: any): void {
    this.activeOperations.set(operationId, {
      startTime: Date.now(),
      metadata: { type, ...metadata },
    });
  }

  async endOperation(operationId: string, success: boolean = true, error?: Error): Promise<number> {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return 0;

    const duration = Date.now() - operation.startTime;
    this.activeOperations.delete(operationId);

    const { type, ...metadata } = operation.metadata;
    const threshold = THRESHOLDS[type as keyof PerformanceThresholds] || THRESHOLDS.api;

    // Log slow operations
    if (duration > threshold) {
      await logger.logPerformanceIssue(
        `Slow ${type} operation: ${operationId}`,
        duration,
        threshold,
        {
          ...metadata,
          success,
          error: error?.message,
        }
      );
    }

    // Log errors
    if (!success && error) {
      await logger.error(`${type} operation failed: ${operationId}`, error, {
        category: LogCategory.SYSTEM_ERROR,
        duration,
        metadata,
      });
    }

    return duration;
  }

  // Database query logging
  async logDatabaseQuery(
    collection: string,
    operation: string,
    query: any,
    duration: number,
    documentsAffected?: number
  ): Promise<void> {
    if (duration > THRESHOLDS.database) {
      await logger.logPerformanceIssue(
        `Slow database query: ${collection}.${operation}`,
        duration,
        THRESHOLDS.database,
        {
          collection,
          operation,
          query: JSON.stringify(query),
          documentsAffected,
        }
      );
    }
  }

  // External API call logging
  async logExternalApiCall(
    service: string,
    endpoint: string,
    method: string,
    duration: number,
    statusCode?: number,
    error?: Error
  ): Promise<void> {
    if (error) {
      await logger.error(`External API call failed: ${service}`, error, {
        category: LogCategory.API_ERROR,
        metadata: {
          service,
          endpoint,
          method,
          duration,
          statusCode,
        },
      });
    } else if (duration > THRESHOLDS.external) {
      await logger.logPerformanceIssue(
        `Slow external API call: ${service}`,
        duration,
        THRESHOLDS.external,
        {
          endpoint,
          method,
          statusCode,
        }
      );
    }
  }

  // Memory usage monitoring
  async checkMemoryUsage(service: string = 'avolship'): Promise<void> {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const percentage = (heapUsedMB / heapTotalMB) * 100;

      if (percentage > 85) {
        await logger.warn(`High memory usage detected`, {
          category: LogCategory.SYSTEM_ERROR,
          action: 'HIGH_MEMORY_USAGE',
          metadata: {
            service,
            heapUsedMB,
            heapTotalMB,
            percentage: percentage.toFixed(2) + '%',
            rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
          },
        });
      }
    }
  }
}

export const performanceLogger = PerformanceLogger.getInstance();

// Middleware to track API performance
export function withPerformanceTracking(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    const operationId = `${req.method}-${req.nextUrl.pathname}-${Date.now()}`;
    
    performanceLogger.startOperation(operationId, 'api', {
      url: req.url,
      method: req.method,
      pathname: req.nextUrl.pathname,
    });

    try {
      const response = await handler(req);
      const duration = await performanceLogger.endOperation(operationId, true);
      
      // Add performance headers
      const headers = new Headers(response.headers);
      headers.set('X-Response-Time', `${duration}ms`);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      await performanceLogger.endOperation(operationId, false, error as Error);
      throw error;
    }
  };
}
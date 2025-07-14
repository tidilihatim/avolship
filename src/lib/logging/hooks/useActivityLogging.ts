import { logger, LogCategory } from '../logger';

export const useActivityLogging = () => {
  const logLoginAttempt = async (
    email: string,
    success: boolean,
    ip?: string,
    userAgent?: string,
    reason?: string
  ) => {
    if (success) {
      await logger.info(`Successful login: ${email}`, {
        category: LogCategory.USER_ACTION,
        action: 'LOGIN_SUCCESS',
        userEmail: email,
        ip,
        userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      await logger.warn(`Failed login attempt: ${email}`, {
        category: LogCategory.AUTH_ERROR,
        action: 'LOGIN_FAILED',
        userEmail: email,
        ip,
        userAgent,
        metadata: {
          reason,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  const logPermissionDenied = async (
    user: { id: string; email: string; role: string },
    attemptedAction: string,
    resource: string,
    requiredRole?: string
  ) => {
    await logger.warn(`Permission denied: ${attemptedAction}`, {
      category: LogCategory.SECURITY_EVENT,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PERMISSION_DENIED',
      resourceType: resource.split('/')[0],
      resourceId: resource.split('/')[1],
      metadata: {
        attemptedAction,
        requiredRole,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logDataExport = async (
    user: { id: string; email: string; role: string },
    dataType: string,
    recordCount: number,
    format: string,
    filters?: any
  ) => {
    await logger.info(`Data exported: ${dataType}`, {
      category: LogCategory.USER_ACTION,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DATA_EXPORT',
      metadata: {
        dataType,
        recordCount,
        format,
        filters,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logBulkImport = async (
    user: { id: string; email: string; role: string },
    dataType: string,
    stats: {
      total: number;
      success: number;
      failed: number;
      duration: number;
    },
    fileName?: string
  ) => {
    await logger.info(`Bulk import completed: ${dataType}`, {
      category: LogCategory.USER_ACTION,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'BULK_IMPORT',
      duration: stats.duration,
      metadata: {
        dataType,
        fileName,
        totalRecords: stats.total,
        successCount: stats.success,
        failureCount: stats.failed,
        successRate: ((stats.success / stats.total) * 100).toFixed(2) + '%',
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logAccountChange = async (
    user: { id: string; email: string; role: string },
    changeType: string,
    changes: Record<string, any>
  ) => {
    await logger.info(`Account updated: ${changeType}`, {
      category: LogCategory.USER_ACTION,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'ACCOUNT_CHANGE',
      metadata: {
        changeType,
        changes,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logPasswordChange = async (
    user: { id: string; email: string; role: string },
    ip?: string
  ) => {
    await logger.logSecurityEvent(
      'PASSWORD_CHANGED',
      user,
      {
        ip,
        timestamp: new Date().toISOString(),
      }
    );
  };

  const logApiKeyGeneration = async (
    user: { id: string; email: string; role: string },
    keyName: string,
    permissions: string[]
  ) => {
    await logger.logSecurityEvent(
      'API_KEY_GENERATED',
      user,
      {
        keyName,
        permissions,
        timestamp: new Date().toISOString(),
      }
    );
  };

  return {
    logLoginAttempt,
    logPermissionDenied,
    logDataExport,
    logBulkImport,
    logAccountChange,
    logPasswordChange,
    logApiKeyGeneration,
  };
};
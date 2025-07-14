import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { logger, LogCategory } from '@/lib/logging/logger';

export function useOperationLogger() {
  const { data: session } = useSession();

  const logOperation = useCallback(
    async (
      action: string,
      resourceType: string,
      resourceId: string,
      metadata?: any
    ) => {
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
    },
    [session]
  );

  const logError = useCallback(
    async (message: string, error: Error, metadata?: any) => {
      await logger.error(message, error, {
        category: LogCategory.SYSTEM_ERROR,
        userId: session?.user?.id,
        userRole: session?.user?.role,
        userEmail: session?.user?.email,
        ...metadata,
      });
    },
    [session]
  );

  const logSecurityEvent = useCallback(
    async (event: string, details: any) => {
      await logger.logSecurityEvent(
        event,
        'warn',
        {
          userId: session?.user?.id,
          userRole: session?.user?.role,
          userEmail: session?.user?.email,
          ...details,
        }
      );
    },
    [session]
  );

  return {
    logOperation,
    logError,
    logSecurityEvent,
  };
}
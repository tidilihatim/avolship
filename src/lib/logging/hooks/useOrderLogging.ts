import { logger, LogCategory } from '../logger';

interface OrderLogData {
  orderId: string;
  userId?: string;
  userEmail?: string;
  metadata?: any;
}

export const useOrderLogging = () => {
  const logOrderStatusChange = async (
    orderId: string,
    previousStatus: string,
    newStatus: string,
    changedBy: { id: string; email: string; role: string },
    reason?: string
  ) => {
    await logger.info(`Order status changed: ${orderId}`, {
      category: LogCategory.CRITICAL_OPERATION,
      userId: changedBy.id,
      userEmail: changedBy.email,
      userRole: changedBy.role,
      action: 'ORDER_STATUS_CHANGE',
      resourceType: 'Order',
      resourceId: orderId,
      metadata: {
        previousStatus,
        newStatus,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logOrderCancellation = async (
    orderId: string,
    cancelledBy: { id: string; email: string; role: string },
    reason: string,
    refundAmount?: number
  ) => {
    await logger.warn(`Order cancelled: ${orderId}`, {
      category: LogCategory.CRITICAL_OPERATION,
      userId: cancelledBy.id,
      userEmail: cancelledBy.email,
      userRole: cancelledBy.role,
      action: 'ORDER_CANCELLATION',
      resourceType: 'Order',
      resourceId: orderId,
      metadata: {
        reason,
        refundAmount,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logDoubleOrderDetected = async (
    originalOrderId: string,
    duplicateOrderId: string,
    customerPhone: string,
    matchingProducts: string[]
  ) => {
    await logger.warn(`Duplicate order detected`, {
      category: LogCategory.VALIDATION_ERROR,
      action: 'DOUBLE_ORDER_DETECTED',
      resourceType: 'Order',
      resourceId: duplicateOrderId,
      metadata: {
        originalOrderId,
        duplicateOrderId,
        customerPhone,
        matchingProducts,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logBulkOrderOperation = async (
    operation: string,
    performedBy: { id: string; email: string; role: string },
    stats: {
      total: number;
      success: number;
      failed: number;
      duration: number;
    }
  ) => {
    await logger.info(`Bulk order operation: ${operation}`, {
      category: LogCategory.USER_ACTION,
      userId: performedBy.id,
      userEmail: performedBy.email,
      userRole: performedBy.role,
      action: 'BULK_ORDER_OPERATION',
      duration: stats.duration,
      metadata: {
        operation,
        totalRecords: stats.total,
        successCount: stats.success,
        failureCount: stats.failed,
        successRate: ((stats.success / stats.total) * 100).toFixed(2) + '%',
      },
    });
  };

  return {
    logOrderStatusChange,
    logOrderCancellation,
    logDoubleOrderDetected,
    logBulkOrderOperation,
  };
};
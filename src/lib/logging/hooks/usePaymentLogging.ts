import { logger, LogCategory } from '../logger';

export const usePaymentLogging = () => {
  const logPaymentReceived = async (
    orderId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    transactionId: string,
    gateway: string,
    customerId?: string
  ) => {
    await logger.info(`Payment received for order ${orderId}`, {
      category: LogCategory.CRITICAL_OPERATION,
      action: 'PAYMENT_RECEIVED',
      resourceType: 'Order',
      resourceId: orderId,
      metadata: {
        amount,
        currency,
        paymentMethod,
        transactionId,
        gateway,
        customerId,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logPaymentFailed = async (
    orderId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    error: string,
    errorCode?: string,
    customerId?: string
  ) => {
    await logger.error(`Payment failed for order ${orderId}: ${error}`, new Error(error), {
      category: LogCategory.PAYMENT_ERROR,
      action: 'PAYMENT_FAILED',
      resourceType: 'Order',
      resourceId: orderId,
      metadata: {
        amount,
        currency,
        paymentMethod,
        errorCode,
        customerId,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logRefundProcessed = async (
    orderId: string,
    refundAmount: number,
    currency: string,
    reason: string,
    processedBy: { id: string; email: string; role: string },
    refundId: string
  ) => {
    await logger.info(`Refund processed for order ${orderId}`, {
      category: LogCategory.CRITICAL_OPERATION,
      userId: processedBy.id,
      userEmail: processedBy.email,
      userRole: processedBy.role,
      action: 'REFUND_PROCESSED',
      resourceType: 'Order',
      resourceId: orderId,
      metadata: {
        refundAmount,
        currency,
        reason,
        refundId,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logSuspiciousTransaction = async (
    orderId: string,
    reasons: string[],
    riskScore: number,
    action: string,
    customerInfo: {
      id?: string;
      email?: string;
      ip?: string;
    }
  ) => {
    await logger.warn(`Suspicious transaction detected for order ${orderId}`, {
      category: LogCategory.SECURITY_EVENT,
      action: 'SUSPICIOUS_TRANSACTION',
      resourceType: 'Order',
      resourceId: orderId,
      metadata: {
        reasons,
        riskScore,
        recommendedAction: action,
        customerId: customerInfo.id,
        customerEmail: customerInfo.email,
        customerIp: customerInfo.ip,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logPaymentGatewayError = async (
    gateway: string,
    error: string,
    endpoint?: string,
    responseTime?: number
  ) => {
    await logger.error(`Payment gateway error: ${gateway}`, new Error(error), {
      category: LogCategory.PAYMENT_ERROR,
      action: 'PAYMENT_GATEWAY_ERROR',
      metadata: {
        gateway,
        endpoint,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  };

  return {
    logPaymentReceived,
    logPaymentFailed,
    logRefundProcessed,
    logSuspiciousTransaction,
    logPaymentGatewayError,
  };
};
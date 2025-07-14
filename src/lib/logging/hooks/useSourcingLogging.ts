import { logger, LogCategory } from '../logger';

export const useSourcingLogging = () => {
  const logSourcingRequestCreated = async (
    requestId: string,
    requestNumber: string,
    seller: { id: string; name: string; email: string },
    productName: string,
    quantity: number,
    targetPrice: number,
    currency: string
  ) => {
    await logger.info(`Sourcing request created: ${requestNumber}`, {
      category: LogCategory.USER_ACTION,
      userId: seller.id,
      userEmail: seller.email,
      action: 'SOURCING_REQUEST_CREATED',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        productName,
        quantity,
        targetPrice,
        currency,
        totalValue: (targetPrice * quantity).toFixed(2),
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logProviderResponse = async (
    requestId: string,
    requestNumber: string,
    provider: { id: string; name: string; email: string },
    adjustedPrice?: number,
    adjustedQuantity?: number
  ) => {
    await logger.info(`Provider responded to sourcing request: ${requestNumber}`, {
      category: LogCategory.USER_ACTION,
      userId: provider.id,
      userEmail: provider.email,
      action: 'SOURCING_PROVIDER_RESPONSE',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        adjustedPrice,
        adjustedQuantity,
        hasAdjustedPrice: !!adjustedPrice,
        hasAdjustedQuantity: !!adjustedQuantity,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logNegotiationMessage = async (
    requestId: string,
    requestNumber: string,
    user: { id: string; name: string; email: string; role: string },
    message: string,
    priceOffer?: number,
    quantityOffer?: number
  ) => {
    await logger.info(`Negotiation message sent: ${requestNumber}`, {
      category: LogCategory.USER_ACTION,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'SOURCING_NEGOTIATION_MESSAGE',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        messageLength: message.length,
        priceOffer,
        quantityOffer,
        hasOffer: !!(priceOffer || quantityOffer),
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logSourcingApproved = async (
    requestId: string,
    requestNumber: string,
    provider: { id: string; name: string; email: string },
    finalPrice: number,
    finalQuantity: number,
    currency: string
  ) => {
    await logger.info(`Sourcing request approved: ${requestNumber}`, {
      category: LogCategory.USER_ACTION,
      userId: provider.id,
      userEmail: provider.email,
      action: 'SOURCING_APPROVED',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        finalPrice,
        finalQuantity,
        currency,
        totalValue: (finalPrice * finalQuantity).toFixed(2),
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logPaymentConfirmed = async (
    requestId: string,
    requestNumber: string,
    provider: { id: string; name: string; email: string },
    amount: number,
    method: string,
    transactionId: string
  ) => {
    await logger.info(`Sourcing payment confirmed: ${requestNumber}`, {
      category: LogCategory.PAYMENT_SUCCESS,
      userId: provider.id,
      userEmail: provider.email,
      action: 'SOURCING_PAYMENT_CONFIRMED',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        amount,
        method,
        transactionId,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logShipmentCreated = async (
    requestId: string,
    requestNumber: string,
    provider: { id: string; name: string; email: string },
    trackingNumber: string,
    carrier: string,
    estimatedDelivery: Date
  ) => {
    await logger.info(`Sourcing shipment created: ${requestNumber}`, {
      category: LogCategory.USER_ACTION,
      userId: provider.id,
      userEmail: provider.email,
      action: 'SOURCING_SHIPPED',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        trackingNumber,
        carrier,
        estimatedDelivery: estimatedDelivery.toISOString(),
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logSourcingDelivered = async (
    requestId: string,
    requestNumber: string,
    user: { id: string; name: string; email: string },
    deliveredAt: Date
  ) => {
    await logger.info(`Sourcing request delivered: ${requestNumber}`, {
      category: LogCategory.USER_ACTION,
      userId: user.id,
      userEmail: user.email,
      action: 'SOURCING_DELIVERED',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        deliveredAt: deliveredAt.toISOString(),
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logSourcingCancelled = async (
    requestId: string,
    requestNumber: string,
    user: { id: string; name: string; email: string },
    reason?: string
  ) => {
    await logger.warn(`Sourcing request cancelled: ${requestNumber}`, {
      category: LogCategory.USER_ACTION,
      userId: user.id,
      userEmail: user.email,
      action: 'SOURCING_CANCELLED',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logSourcingError = async (
    requestId: string,
    requestNumber: string,
    error: Error,
    operation: string,
    user?: { id: string; name: string; email: string }
  ) => {
    await logger.error(`Sourcing error in ${operation}: ${requestNumber}`, error, {
      category: LogCategory.API_ERROR,
      userId: user?.id,
      userEmail: user?.email,
      action: 'SOURCING_ERROR',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        operation,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logSourcingStatusChange = async (
    requestId: string,
    requestNumber: string,
    user: { id: string; name: string; email: string },
    previousStatus: string,
    newStatus: string
  ) => {
    await logger.info(`Sourcing status changed: ${requestNumber}`, {
      category: LogCategory.USER_ACTION,
      userId: user.id,
      userEmail: user.email,
      action: 'SOURCING_STATUS_CHANGE',
      resourceType: 'SourcingRequest',
      resourceId: requestId,
      metadata: {
        requestNumber,
        previousStatus,
        newStatus,
        timestamp: new Date().toISOString(),
      },
    });
  };

  return {
    logSourcingRequestCreated,
    logProviderResponse,
    logNegotiationMessage,
    logSourcingApproved,
    logPaymentConfirmed,
    logShipmentCreated,
    logSourcingDelivered,
    logSourcingCancelled,
    logSourcingError,
    logSourcingStatusChange,
  };
};
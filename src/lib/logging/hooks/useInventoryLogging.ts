import { logger, LogCategory } from '../logger';

export const useInventoryLogging = () => {
  const logLowStockAlert = async (
    productId: string,
    productName: string,
    currentStock: number,
    threshold: number,
    warehouseId: string
  ) => {
    await logger.warn(`Low stock alert: ${productName}`, {
      category: LogCategory.SYSTEM_ERROR,
      action: 'LOW_STOCK_ALERT',
      resourceType: 'Product',
      resourceId: productId,
      metadata: {
        productName,
        currentStock,
        threshold,
        warehouseId,
        stockPercentage: ((currentStock / threshold) * 100).toFixed(2) + '%',
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logStockAdjustment = async (
    productId: string,
    productName: string,
    previousQuantity: number,
    newQuantity: number,
    reason: string,
    adjustedBy: { id: string; email: string; role: string }
  ) => {
    const adjustment = newQuantity - previousQuantity;
    const isIncrease = adjustment > 0;

    await logger.info(`Stock ${isIncrease ? 'increased' : 'decreased'}: ${productName}`, {
      category: LogCategory.CRITICAL_OPERATION,
      userId: adjustedBy.id,
      userEmail: adjustedBy.email,
      userRole: adjustedBy.role,
      action: 'STOCK_ADJUSTMENT',
      resourceType: 'Product',
      resourceId: productId,
      metadata: {
        productName,
        previousQuantity,
        newQuantity,
        adjustment: isIncrease ? `+${adjustment}` : adjustment.toString(),
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logInventorySync = async (
    warehouseId: string,
    syncedBy: { id: string; email: string; role: string },
    stats: {
      productsUpdated: number;
      discrepancies: number;
      duration: number;
    }
  ) => {
    await logger.info(`Inventory sync completed for warehouse ${warehouseId}`, {
      category: LogCategory.USER_ACTION,
      userId: syncedBy.id,
      userEmail: syncedBy.email,
      userRole: syncedBy.role,
      action: 'INVENTORY_SYNC',
      resourceType: 'Warehouse',
      resourceId: warehouseId,
      duration: stats.duration,
      metadata: {
        productsUpdated: stats.productsUpdated,
        discrepancies: stats.discrepancies,
        syncTime: new Date().toISOString(),
      },
    });
  };

  const logOutOfStock = async (
    productId: string,
    productName: string,
    warehouseId: string,
    lastStockQuantity: number
  ) => {
    await logger.error(`Product out of stock: ${productName}`, undefined, {
      category: LogCategory.SYSTEM_ERROR,
      action: 'OUT_OF_STOCK',
      resourceType: 'Product',
      resourceId: productId,
      metadata: {
        productName,
        warehouseId,
        lastStockQuantity,
        timestamp: new Date().toISOString(),
      },
    });
  };

  return {
    logLowStockAlert,
    logStockAdjustment,
    logInventorySync,
    logOutOfStock,
  };
};
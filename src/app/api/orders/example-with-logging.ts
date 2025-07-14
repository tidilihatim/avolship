// Example of how to integrate logging into your order API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import Order from '@/lib/db/models/order';
import { useOrderLogging } from '@/lib/logging/hooks/useOrderLogging';
import { useInventoryLogging } from '@/lib/logging/hooks/useInventoryLogging';
import { usePaymentLogging } from '@/lib/logging/hooks/usePaymentLogging';
import { performanceLogger } from '@/lib/logging/middleware/performance-logger';
import { logger } from '@/lib/logging/logger';

// Example: Update order status with comprehensive logging
export async function updateOrderStatus(req: NextRequest) {
  const orderLogging = useOrderLogging();
  const paymentLogging = usePaymentLogging();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, newStatus, reason } = await req.json();
    
    // Start performance tracking
    const dbOpId = `db-order-update-${Date.now()}`;
    performanceLogger.startOperation(dbOpId, 'database', {
      operation: 'updateOrderStatus',
      orderId,
    });

    await connectToDatabase();
    
    // Get current order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = order.status;

    // Update order
    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      changedBy: session.user.id,
      changedAt: new Date(),
      reason,
    });

    await order.save();
    
    // End performance tracking
    const dbDuration = await performanceLogger.endOperation(dbOpId, true);

    // Log the status change
    await orderLogging.logOrderStatusChange(
      orderId,
      previousStatus,
      newStatus,
      {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      reason
    );

    // Additional logging based on status
    if (newStatus === 'CANCELLED') {
      await orderLogging.logOrderCancellation(
        orderId,
        {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
        reason,
        order.totalAmount
      );
    }

    if (newStatus === 'PAID') {
      await paymentLogging.logPaymentReceived(
        orderId,
        order.totalAmount,
        order.currency,
        order.paymentMethod || 'unknown',
        order.transactionId || 'manual',
        'manual-confirmation',
        order.customerId
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        status: order.status,
        previousStatus,
      },
      performance: {
        dbOperationTime: `${dbDuration}ms`,
      },
    });

  } catch (error: any) {
    await logger.error('Failed to update order status', error, {
      category: LogCategory.API_ERROR,
      url: req.url,
      method: req.method,
      statusCode: 500,
    });

    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

// Example: Detect and log duplicate orders
export async function checkDuplicateOrders(
  customerId: string,
  phoneNumber: string,
  products: string[]
) {
  const orderLogging = useOrderLogging();
  
  try {
    // Check for recent orders with same phone and products
    const recentOrders = await Order.find({
      $or: [
        { customerId },
        { 'customer.phone': phoneNumber }
      ],
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      'items.productId': { $in: products },
    }).limit(5);

    if (recentOrders.length > 0) {
      // Log each potential duplicate
      for (const existingOrder of recentOrders) {
        const matchingProducts = existingOrder.items
          .filter(item => products.includes(item.productId))
          .map(item => item.productId);

        await orderLogging.logDoubleOrderDetected(
          existingOrder._id.toString(),
          'NEW_ORDER_ID', // Would be the new order ID
          phoneNumber,
          matchingProducts
        );
      }
    }

    return recentOrders;
  } catch (error) {
    logger.error('Error checking duplicate orders', error as Error);
    return [];
  }
}

// Example: Log inventory updates when order is confirmed
export async function updateInventoryForOrder(orderId: string) {
  const inventoryLogging = useInventoryLogging();
  
  try {
    const order = await Order.findById(orderId).populate('items.product');
    
    for (const item of order.items) {
      const product = item.product;
      const previousStock = product.stock;
      const newStock = previousStock - item.quantity;
      
      // Update stock
      product.stock = newStock;
      await product.save();
      
      // Log stock adjustment
      await inventoryLogging.logStockAdjustment(
        product._id.toString(),
        product.name,
        previousStock,
        newStock,
        `Order confirmed: ${orderId}`,
        {
          id: 'system',
          email: 'system@avolship.com',
          role: 'SYSTEM',
        }
      );
      
      // Check for low stock
      if (newStock <= product.lowStockThreshold) {
        await inventoryLogging.logLowStockAlert(
          product._id.toString(),
          product.name,
          newStock,
          product.lowStockThreshold,
          order.warehouseId
        );
      }
      
      // Check for out of stock
      if (newStock === 0) {
        await inventoryLogging.logOutOfStock(
          product._id.toString(),
          product.name,
          order.warehouseId,
          previousStock
        );
      }
    }
  } catch (error) {
    logger.error('Error updating inventory', error as Error);
    throw error;
  }
}
"use server";

import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import { 
  confirmOrderWithStock, 
  cancelOrderWithStock,
  transferStock,
  bulkUpdateStock
} from '@/lib/db/transactions';
import { withDbConnection } from '@/lib/db/db-connect';
import { cache } from '@/lib/redis';
import { revalidatePath } from 'next/cache';

/**
 * Confirm order with stock updates (transactional)
 */
export const confirmOrder = withDbConnection(async (orderId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Check permissions
    const allowedRoles = [UserRole.ADMIN, UserRole.MODERATOR, UserRole.WAREHOUSE];
    if (!allowedRoles.includes(user.role as UserRole)) {
      return {
        success: false,
        message: 'You do not have permission to confirm orders',
      };
    }

    // Perform transactional update
    const result = await confirmOrderWithStock(orderId, user._id.toString());
    
    if (result.success) {
      // Invalidate cache
      await cache.del(`order:${orderId}`);
      await cache.invalidatePattern(`orders:*`);
      
      // Revalidate paths
      revalidatePath('/dashboard/seller/orders');
      revalidatePath('/dashboard/admin/orders');
      revalidatePath(`/dashboard/seller/orders/${orderId}`);
    }
    
    return result;
  } catch (error: any) {
    console.error('Error confirming order:', error);
    return {
      success: false,
      message: error.message || 'Failed to confirm order',
    };
  }
});

/**
 * Cancel order with stock restoration (transactional)
 */
export const cancelOrder = withDbConnection(async (
  orderId: string, 
  reason?: string
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Check permissions
    const allowedRoles = [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SELLER];
    if (!allowedRoles.includes(user.role as UserRole)) {
      return {
        success: false,
        message: 'You do not have permission to cancel orders',
      };
    }

    // Perform transactional update
    const result = await cancelOrderWithStock(
      orderId, 
      user._id.toString(),
      reason
    );
    
    if (result.success) {
      // Invalidate cache
      await cache.del(`order:${orderId}`);
      await cache.invalidatePattern(`orders:*`);
      
      // Revalidate paths
      revalidatePath('/dashboard/seller/orders');
      revalidatePath('/dashboard/admin/orders');
      revalidatePath(`/dashboard/seller/orders/${orderId}`);
    }
    
    return result;
  } catch (error: any) {
    console.error('Error canceling order:', error);
    return {
      success: false,
      message: error.message || 'Failed to cancel order',
    };
  }
});

/**
 * Transfer stock between warehouses (transactional)
 */
export const transferStockBetweenWarehouses = withDbConnection(async (
  productId: string,
  fromWarehouseId: string,
  toWarehouseId: string,
  quantity: number,
  notes?: string
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Check permissions
    const allowedRoles = [UserRole.ADMIN, UserRole.WAREHOUSE];
    if (!allowedRoles.includes(user.role as UserRole)) {
      return {
        success: false,
        message: 'You do not have permission to transfer stock',
      };
    }

    // Perform transactional transfer
    const result = await transferStock(
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      user._id.toString(),
      notes
    );
    
    if (result.success) {
      // Invalidate cache
      await cache.del(`product:${productId}`);
      await cache.invalidatePattern(`products:warehouse:*`);
      
      // Revalidate paths
      revalidatePath('/dashboard/seller/products');
      revalidatePath('/dashboard/admin/warehouse');
    }
    
    return result;
  } catch (error: any) {
    console.error('Error transferring stock:', error);
    return {
      success: false,
      message: error.message || 'Failed to transfer stock',
    };
  }
});

/**
 * Bulk update stock (transactional)
 */
export const bulkStockUpdate = withDbConnection(async (
  updates: Array<{
    productId: string;
    warehouseId: string;
    quantity: number;
    reason: string;
    notes?: string;
  }>
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Check permissions
    const allowedRoles = [UserRole.ADMIN, UserRole.WAREHOUSE];
    if (!allowedRoles.includes(user.role as UserRole)) {
      return {
        success: false,
        message: 'You do not have permission to update stock',
      };
    }

    // Perform transactional update
    const result = await bulkUpdateStock(
      updates as any,
      user._id.toString()
    );
    
    if (result.success) {
      // Invalidate cache for all affected products
      for (const update of updates) {
        await cache.del(`product:${update.productId}`);
      }
      await cache.invalidatePattern(`products:*`);
      
      // Revalidate paths
      revalidatePath('/dashboard/seller/products');
      revalidatePath('/dashboard/admin/warehouse');
    }
    
    return result;
  } catch (error: any) {
    console.error('Error updating stock:', error);
    return {
      success: false,
      message: error.message || 'Failed to update stock',
    };
  }
});
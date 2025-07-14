import mongoose, { ClientSession } from 'mongoose';
import Order, { IOrder, OrderStatus } from '@/lib/db/models/order';
import Product from '@/lib/db/models/product';
import StockHistory from '@/lib/db/models/stock-history';
import Expedition, { IExpedition } from '@/lib/db/models/expedition';
import { StockMovementType, StockMovementReason } from '@/lib/db/models/stock-history';

/**
 * Execute a function within a MongoDB transaction
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Confirm an order with stock updates in a transaction
 */
export async function confirmOrderWithStock(
  orderId: string,
  userId: string
): Promise<{ success: boolean; message: string; order?: IOrder }> {
  return withTransaction(async (session) => {
    // Find and lock the order
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status !== OrderStatus.PENDING) {
      throw new Error(`Cannot confirm order with status ${order.status}`);
    }
    
    // Update order status
    order.status = OrderStatus.CONFIRMED;
    order.statusChangedBy = new mongoose.Types.ObjectId(userId);
    order.statusChangedAt = new Date();
    
    // Update stock for each product
    for (const orderProduct of order.products) {
      const product = await Product.findById(orderProduct.productId).session(session);
      
      if (!product) {
        throw new Error(`Product ${orderProduct.productId} not found`);
      }
      
      // Find the warehouse inventory
      const warehouseInventory = product.warehouses.find(
        w => w.warehouseId.toString() === order.warehouseId.toString()
      );
      
      if (!warehouseInventory) {
        throw new Error(`Product not available in warehouse ${order.warehouseId}`);
      }
      
      if (warehouseInventory.stock < orderProduct.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }
      
      // Update stock
      warehouseInventory.stock -= orderProduct.quantity;
      
      // Recalculate total stock
      product.totalStock = product.warehouses.reduce((sum, w) => sum + w.stock, 0);
      
      // Save product with session
      await product.save({ session });
      
      // Create stock history entry
      await StockHistory.create([{
        productId: product._id,
        warehouseId: order.warehouseId,
        movementType: StockMovementType.DECREASE,
        reason: StockMovementReason.ORDER_CONFIRMED,
        quantity: orderProduct.quantity,
        previousStock: warehouseInventory.stock + orderProduct.quantity,
        newStock: warehouseInventory.stock,
        orderId: order._id,
        userId: new mongoose.Types.ObjectId(userId),
        notes: `Order ${order.orderId} confirmed`,
        metadata: {
          orderNumber: order.orderId,
          customerName: order.customer.name
        }
      }], { session });
    }
    
    // Save the order
    await order.save({ session });
    
    return {
      success: true,
      message: 'Order confirmed successfully',
      order
    };
  });
}

/**
 * Cancel an order and restore stock in a transaction
 */
export async function cancelOrderWithStock(
  orderId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; message: string; order?: IOrder }> {
  return withTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Only restore stock if order was confirmed or preparing
    const shouldRestoreStock = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING
    ].includes(order.status);
    
    // Update order status
    order.status = OrderStatus.CANCELED;
    order.statusChangedBy = new mongoose.Types.ObjectId(userId);
    order.statusChangedAt = new Date();
    order.cancellationReason = reason;
    
    // Restore stock if needed
    if (shouldRestoreStock) {
      for (const orderProduct of order.products) {
        const product = await Product.findById(orderProduct.productId).session(session);
        
        if (!product) {
          console.warn(`Product ${orderProduct.productId} not found during cancellation`);
          continue;
        }
        
        const warehouseInventory = product.warehouses.find(
          w => w.warehouseId.toString() === order.warehouseId.toString()
        );
        
        if (warehouseInventory) {
          // Restore stock
          warehouseInventory.stock += orderProduct.quantity;
          
          // Recalculate total stock
          product.totalStock = product.warehouses.reduce((sum, w) => sum + w.stock, 0);
          
          // Save product
          await product.save({ session });
          
          // Create stock history entry
          await StockHistory.create([{
            productId: product._id,
            warehouseId: order.warehouseId,
            movementType: StockMovementType.INCREASE,
            reason: StockMovementReason.ORDER_CANCELED,
            quantity: orderProduct.quantity,
            previousStock: warehouseInventory.stock - orderProduct.quantity,
            newStock: warehouseInventory.stock,
            orderId: order._id,
            userId: new mongoose.Types.ObjectId(userId),
            notes: `Order ${order.orderId} canceled - stock restored`,
            metadata: {
              orderNumber: order.orderId,
              cancellationReason: reason
            }
          }], { session });
        }
      }
    }
    
    await order.save({ session });
    
    return {
      success: true,
      message: 'Order canceled successfully',
      order
    };
  });
}

/**
 * Create expedition with stock allocation in a transaction
 */
export async function createExpeditionWithStock(
  expeditionData: Partial<IExpedition>,
  userId: string
): Promise<{ success: boolean; message: string; expedition?: IExpedition }> {
  return withTransaction(async (session) => {
    // Create the expedition
    const [expedition] = await Expedition.create([expeditionData], { session });
    
    // Allocate stock for each product
    for (const expeditionProduct of expedition.products) {
      const product = await Product.findById(expeditionProduct.productId).session(session);
      
      if (!product) {
        throw new Error(`Product ${expeditionProduct.productId} not found`);
      }
      
      const warehouseInventory = product.warehouses.find(
        w => w.warehouseId.toString() === expedition.warehouseId.toString()
      );
      
      if (!warehouseInventory) {
        throw new Error(`Product not available in warehouse`);
      }
      
      if (warehouseInventory.stock < expeditionProduct.requestedQuantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }
      
      // Allocate stock (reduce available stock)
      warehouseInventory.stock -= expeditionProduct.requestedQuantity;
      product.totalStock = product.warehouses.reduce((sum, w) => sum + w.stock, 0);
      
      await product.save({ session });
      
      // Create stock history
      await StockHistory.create([{
        productId: product._id,
        warehouseId: expedition.warehouseId,
        movementType: StockMovementType.DECREASE,
        reason: StockMovementReason.EXPEDITION_CREATED,
        quantity: expeditionProduct.requestedQuantity,
        previousStock: warehouseInventory.stock + expeditionProduct.requestedQuantity,
        newStock: warehouseInventory.stock,
        expeditionId: expedition._id,
        userId: new mongoose.Types.ObjectId(userId),
        notes: `Expedition ${expedition.expeditionId} created`,
        metadata: {
          expeditionId: expedition.expeditionId,
          providerId: expedition.providerId
        }
      }], { session });
    }
    
    return {
      success: true,
      message: 'Expedition created successfully',
      expedition
    };
  });
}

/**
 * Bulk update stock with transaction
 */
export async function bulkUpdateStock(
  updates: Array<{
    productId: string;
    warehouseId: string;
    quantity: number;
    reason: StockMovementReason;
    notes?: string;
  }>,
  userId: string
): Promise<{ success: boolean; message: string; updated: number }> {
  return withTransaction(async (session) => {
    let updated = 0;
    
    for (const update of updates) {
      const product = await Product.findById(update.productId).session(session);
      
      if (!product) {
        throw new Error(`Product ${update.productId} not found`);
      }
      
      const warehouseInventory = product.warehouses.find(
        w => w.warehouseId.toString() === update.warehouseId
      );
      
      if (!warehouseInventory) {
        throw new Error(`Product not in warehouse ${update.warehouseId}`);
      }
      
      const previousStock = warehouseInventory.stock;
      const movementType = update.quantity > 0 
        ? StockMovementType.INCREASE 
        : StockMovementType.DECREASE;
      
      // Update stock
      warehouseInventory.stock += update.quantity;
      
      if (warehouseInventory.stock < 0) {
        throw new Error(`Stock cannot be negative for product ${product.name}`);
      }
      
      // Recalculate total
      product.totalStock = product.warehouses.reduce((sum, w) => sum + w.stock, 0);
      
      await product.save({ session });
      
      // Create history
      await StockHistory.create([{
        productId: product._id,
        warehouseId: update.warehouseId,
        movementType,
        reason: update.reason,
        quantity: Math.abs(update.quantity),
        previousStock,
        newStock: warehouseInventory.stock,
        userId: new mongoose.Types.ObjectId(userId),
        notes: update.notes || 'Bulk stock update',
        metadata: {
          bulkUpdate: true
        }
      }], { session });
      
      updated++;
    }
    
    return {
      success: true,
      message: `Successfully updated stock for ${updated} products`,
      updated
    };
  });
}

/**
 * Transfer stock between warehouses in a transaction
 */
export async function transferStock(
  productId: string,
  fromWarehouseId: string,
  toWarehouseId: string,
  quantity: number,
  userId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  return withTransaction(async (session) => {
    const product = await Product.findById(productId).session(session);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const fromWarehouse = product.warehouses.find(
      w => w.warehouseId.toString() === fromWarehouseId
    );
    
    if (!fromWarehouse) {
      throw new Error('Product not found in source warehouse');
    }
    
    if (fromWarehouse.stock < quantity) {
      throw new Error('Insufficient stock in source warehouse');
    }
    
    let toWarehouse = product.warehouses.find(
      w => w.warehouseId.toString() === toWarehouseId
    );
    
    if (!toWarehouse) {
      // Add new warehouse entry
      product.warehouses.push({
        warehouseId: new mongoose.Types.ObjectId(toWarehouseId),
        stock: 0
      });
      toWarehouse = product.warehouses[product.warehouses.length - 1];
    }
    
    // Perform transfer
    fromWarehouse.stock -= quantity;
    toWarehouse.stock += quantity;
    
    await product.save({ session });
    
    // Create history entries
    await StockHistory.create([
      {
        productId: product._id,
        warehouseId: fromWarehouseId,
        movementType: StockMovementType.DECREASE,
        reason: StockMovementReason.TRANSFER_OUT,
        quantity,
        previousStock: fromWarehouse.stock + quantity,
        newStock: fromWarehouse.stock,
        userId: new mongoose.Types.ObjectId(userId),
        notes: notes || `Transfer to warehouse ${toWarehouseId}`,
        metadata: {
          transferTo: toWarehouseId
        }
      },
      {
        productId: product._id,
        warehouseId: toWarehouseId,
        movementType: StockMovementType.INCREASE,
        reason: StockMovementReason.TRANSFER_IN,
        quantity,
        previousStock: toWarehouse.stock - quantity,
        newStock: toWarehouse.stock,
        userId: new mongoose.Types.ObjectId(userId),
        notes: notes || `Transfer from warehouse ${fromWarehouseId}`,
        metadata: {
          transferFrom: fromWarehouseId
        }
      }
    ], { session });
    
    return {
      success: true,
      message: 'Stock transferred successfully'
    };
  });
}
// src/lib/db/models/stock-history.ts
import mongoose, { Document, Schema } from 'mongoose';

/**
 * Stock movement types
 */
export enum StockMovementType {
  INCREASE = 'increase',
  DECREASE = 'decrease',
}

/**
 * Stock movement reasons
 */
export enum StockMovementReason {
  // Increases
  INITIAL_STOCK = 'initial_stock',
  RESTOCK = 'restock',
  RETURN_FROM_CUSTOMER = 'return_from_customer',
  WAREHOUSE_TRANSFER_IN = 'warehouse_transfer_in',
  MANUAL_ADJUSTMENT_INCREASE = 'manual_adjustment_increase',
  INVENTORY_CORRECTION_INCREASE = 'inventory_correction_increase',
  
  // Decreases
  ORDER_CONFIRMED = 'order_confirmed',
  DAMAGED_GOODS = 'damaged_goods',
  LOST_GOODS = 'lost_goods',
  WAREHOUSE_TRANSFER_OUT = 'warehouse_transfer_out',
  MANUAL_ADJUSTMENT_DECREASE = 'manual_adjustment_decrease',
  INVENTORY_CORRECTION_DECREASE = 'inventory_correction_decrease',
  EXPIRED_GOODS = 'expired_goods',
}

/**
 * Stock History interface
 */
export interface IStockHistory extends Document {
  productId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  movementType: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: mongoose.Types.ObjectId;
  transferId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  notes?: string;
  metadata?: {
    batchNumber?: string;
    expiryDate?: Date;
    supplier?: string;
    cost?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  getMovementDescription(): string;
  getStockDifference(): number;
}

/**
 * Stock History Model interface with static methods
 */
export interface IStockHistoryModel extends mongoose.Model<IStockHistory> {
  recordMovement(
    productId: mongoose.Types.ObjectId,
    warehouseId: mongoose.Types.ObjectId,
    movementType: StockMovementType,
    reason: StockMovementReason,
    quantity: number,
    previousStock: number,
    newStock: number,
    userId: mongoose.Types.ObjectId,
    options?: {
      orderId?: mongoose.Types.ObjectId;
      transferId?: mongoose.Types.ObjectId;
      notes?: string;
      metadata?: any;
    }
  ): Promise<IStockHistory>;
}

/**
 * Mongoose schema for Stock History model
 */
const StockHistorySchema = new Schema<IStockHistory>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse ID is required'],
      index: true,
    },
    movementType: {
      type: String,
      enum: Object.values(StockMovementType),
      required: [true, 'Movement type is required'],
    },
    reason: {
      type: String,
      enum: Object.values(StockMovementReason),
      required: [true, 'Movement reason is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be positive'],
    },
    previousStock: {
      type: Number,
      required: [true, 'Previous stock is required'],
      min: [0, 'Previous stock cannot be negative'],
    },
    newStock: {
      type: Number,
      required: [true, 'New stock is required'],
      min: [0, 'New stock cannot be negative'],
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    transferId: {
      type: Schema.Types.ObjectId,
      ref: 'Transfer',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
StockHistorySchema.index({ productId: 1, createdAt: -1 });
StockHistorySchema.index({ warehouseId: 1, createdAt: -1 });
StockHistorySchema.index({ productId: 1, warehouseId: 1, createdAt: -1 });
StockHistorySchema.index({ userId: 1, createdAt: -1 });
StockHistorySchema.index({ reason: 1, createdAt: -1 });
StockHistorySchema.index({ movementType: 1, createdAt: -1 });

// Method to get stock difference
StockHistorySchema.methods.getStockDifference = function(): number {
  return this.newStock - this.previousStock;
};

// Method to format movement description
StockHistorySchema.methods.getMovementDescription = function(this: IStockHistory): string {
  const reasonMap: Record<StockMovementReason, string> = {
    [StockMovementReason.INITIAL_STOCK]: 'Initial stock added',
    [StockMovementReason.RESTOCK]: 'Restocked from supplier',
    [StockMovementReason.RETURN_FROM_CUSTOMER]: 'Customer return',
    [StockMovementReason.WAREHOUSE_TRANSFER_IN]: 'Transfer from another warehouse',
    [StockMovementReason.MANUAL_ADJUSTMENT_INCREASE]: 'Manual stock increase',
    [StockMovementReason.INVENTORY_CORRECTION_INCREASE]: 'Inventory correction (increase)',
    [StockMovementReason.ORDER_CONFIRMED]: 'Order confirmed and shipped',
    [StockMovementReason.DAMAGED_GOODS]: 'Damaged goods removed',
    [StockMovementReason.LOST_GOODS]: 'Lost goods removed',
    [StockMovementReason.WAREHOUSE_TRANSFER_OUT]: 'Transfer to another warehouse',
    [StockMovementReason.MANUAL_ADJUSTMENT_DECREASE]: 'Manual stock decrease',
    [StockMovementReason.INVENTORY_CORRECTION_DECREASE]: 'Inventory correction (decrease)',
    [StockMovementReason.EXPIRED_GOODS]: 'Expired goods removed',
  };

  return reasonMap[this.reason as StockMovementReason] || 'Unknown movement';
};

// Static method to record stock movement
StockHistorySchema.statics.recordMovement = async function(
  productId: mongoose.Types.ObjectId,
  warehouseId: mongoose.Types.ObjectId,
  movementType: StockMovementType,
  reason: StockMovementReason,
  quantity: number,
  previousStock: number,
  newStock: number,
  userId: mongoose.Types.ObjectId,
  options?: {
    orderId?: mongoose.Types.ObjectId;
    transferId?: mongoose.Types.ObjectId;
    notes?: string;
    metadata?: any;
  }
) {
  const stockHistory = new this({
    productId,
    warehouseId,
    movementType,
    reason,
    quantity,
    previousStock,
    newStock,
    userId,
    ...options,
  });

  return await stockHistory.save();
};

// Create the model only if it doesn't already exist
const StockHistory = (mongoose.models?.StockHistory || mongoose.model<IStockHistory, IStockHistoryModel>('StockHistory', StockHistorySchema)) as IStockHistoryModel;

export default StockHistory;
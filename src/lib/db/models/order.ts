// src/lib/db/models/order.ts
import mongoose, { Document, Schema } from 'mongoose';

/**
 * Order status enum based on requirements
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  WRONG_NUMBER = 'wrong_number',
  DOUBLE = 'double',
  UNREACHED = 'unreached',
  EXPIRED = 'expired',
}

/**
 * Customer information interface
 */
export interface CustomerInfo {
  name: string;
  phoneNumbers: string[]; // Multiple phone numbers for single customer
  shippingAddress: string; // Simple string for shipping address
}

/**
 * Order product interface
 * Links to Product model but stores fresh quantity and price from expedition
 */
export interface OrderProduct {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number; // Price taken from expedition
  expeditionId: mongoose.Types.ObjectId; // Reference to expedition for price validation
}

/**
 * Call attempt interface for tracking customer contact attempts
 */
export interface CallAttempt {
  attemptNumber: number;
  phoneNumber: string;
  attemptDate: Date;
  status: 'answered' | 'unreached' | 'busy' | 'invalid';
  notes?: string;
  callCenterAgent?: mongoose.Types.ObjectId; // Reference to call center user
}

/**
 * Double order reference interface
 */
export interface DoubleOrderReference {
  orderId: mongoose.Types.ObjectId;
  similarity: {
    sameName: boolean;
    samePhone: boolean;
    sameProduct: boolean;
    orderDateDifference: number; // Hours difference
  };
}

/**
 * Order interface based on SRS requirements (Section 2.3)
 */
export interface IOrder extends Document {
  orderId: string; // Auto-generated unique order ID
  
  // Customer Information
  customer: CustomerInfo;
  
  // Order Details
  warehouseId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  products: OrderProduct[];
  totalPrice: number;
  
  // Status Management
  status: OrderStatus;
  statusComment?: string; // Reason for status change (e.g., cancellation reason)
  statusChangedBy?: mongoose.Types.ObjectId; // Call center agent who changed status
  statusChangedAt: Date;
  
  // Call Tracking
  callAttempts: CallAttempt[];
  totalCallAttempts: number;
  lastCallAttempt?: Date;
  
  // Double Order Detection
  isDouble: boolean;
  doubleOrderReferences: DoubleOrderReference[];
  
  // Timestamps
  orderDate: Date; // For double order detection (same day logic)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Order model
 */
const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      unique: true,
      trim: true,
    },
    
    // Customer Information
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      phoneNumbers: [{
        type: String,
        required: [true, 'At least one phone number is required'],
        trim: true,
      }],
      shippingAddress: {
        type: String,
        required: [true, 'Shipping address is required'],
        trim: true,
      },
    },
    
    // Order Details
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    products: [{
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
      },
      unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: [0, 'Unit price cannot be negative'],
      },
      expeditionId: {
        type: Schema.Types.ObjectId,
        ref: 'Expedition',
        required: [true, 'Expedition reference is required for pricing'],
      },
    }],
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    
    // Status Management
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    statusComment: {
      type: String,
      trim: true,
    },
    statusChangedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    statusChangedAt: {
      type: Date,
      default: Date.now,
    },
    
    // Call Tracking
    callAttempts: [{
      attemptNumber: {
        type: Number,
        required: [true, 'Attempt number is required'],
      },
      phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
      },
      attemptDate: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['answered', 'unreached', 'busy', 'invalid'],
        required: [true, 'Call status is required'],
      },
      notes: {
        type: String,
        trim: true,
      },
      callCenterAgent: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
    totalCallAttempts: {
      type: Number,
      default: 0,
      min: [0, 'Total call attempts cannot be negative'],
    },
    lastCallAttempt: {
      type: Date,
    },
    
    // Double Order Detection
    isDouble: {
      type: Boolean,
      default: false,
      index: true,
    },
    doubleOrderReferences: [{
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
      similarity: {
        sameName: {
          type: Boolean,
          default: false,
        },
        samePhone: {
          type: Boolean,
          default: false,
        },
        sameProduct: {
          type: Boolean,
          default: false,
        },
        orderDateDifference: {
          type: Number, // Hours difference
          default: 0,
        },
      },
    }],
    
    // Timestamps
    orderDate: {
      type: Date,
      default: Date.now,
      index: true, // For double order detection queries
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index({ warehouseId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'customer.name': 1, 'customer.phoneNumbers': 1, orderDate: 1 }); // For double order detection
OrderSchema.index({ orderDate: 1, sellerId: 1 });

// Pre-save middleware to auto-generate order ID
OrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderId) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Pre-save middleware to calculate total price
OrderSchema.pre('save', function (next) {
  if (this.products && this.products.length > 0) {
    this.totalPrice = this.products.reduce(
      (total, product) => total + (product.unitPrice * product.quantity),
      0
    );
  }
  next();
});

// Pre-save middleware to update call attempts count
OrderSchema.pre('save', function (next) {
  if (this.callAttempts && this.callAttempts.length > 0) {
    this.totalCallAttempts = this.callAttempts.length;
    // Sort call attempts by date and get the latest
    const sortedAttempts = [...this.callAttempts].sort(
      (a, b) => new Date(b.attemptDate).getTime() - new Date(a.attemptDate).getTime()
    );
    this.lastCallAttempt = sortedAttempts[0].attemptDate;
  }
  next();
});

// Static method for double order detection
OrderSchema.statics.findPotentialDoubles = async function(
  customerName: string,
  phoneNumbers: string[],
  productIds: mongoose.Types.ObjectId[],
  orderDate: Date,
  excludeOrderId?: mongoose.Types.ObjectId
) {
  const startOfDay = new Date(orderDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(orderDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const query: any = {
    orderDate: { $gte: startOfDay, $lte: endOfDay },
    $or: [
      { 'customer.name': { $regex: new RegExp(customerName, 'i') } },
      { 'customer.phoneNumbers': { $in: phoneNumbers } },
      { 'products.productId': { $in: productIds } },
    ],
  };
  
  if (excludeOrderId) {
    query._id = { $ne: excludeOrderId };
  }
  
  return this.find(query);
};

// Create the model only if it doesn't already exist
const Order = mongoose.models?.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
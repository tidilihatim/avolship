// src/lib/db/models/order.ts
import mongoose, { Document, Schema } from 'mongoose';

/**
 * Order status enum based on requirements
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  SHIPPED = 'shipped',
  ASSIGNED_TO_DELIVERY = 'assigned_to_delivery',
  ACCEPTED_BY_DELIVERY = 'accepted_by_delivery',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  DELIVERY_FAILED = 'delivery_failed',
  REFUNDED = 'refunded',
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
  location?: {
    latitude: number;
    longitude: number;
  };
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
 * Call recording interface for AWS S3 stored recordings
 */
export interface CallRecording {
  recordingId: string;
  s3Bucket: string;
  s3Key: string;
  s3Url: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  mimeType: string;
  recordedAt: Date;
  uploadedAt: Date;
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
  recording?: CallRecording; // Optional call recording stored in S3
}

/**
 * Double order reference interface - Updated for rule-based detection
 */
export interface DoubleOrderReference {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string; // The display order ID (e.g., ORD-12345678-ABCD)
  matchedRule: string; // Name of the rule that detected this duplicate
  detectedAt: Date; // When this duplicate was detected
}

/**
 * Delivery tracking interface for real-time delivery monitoring
 */
export interface DeliveryTracking {
  deliveryGuyId: mongoose.Types.ObjectId;
  assignedAt: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryFee: number;
  commission: number;
  distance?: number; // Distance in kilometers
  trackingNumber: string; // Unique tracking number for customers
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  route?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  }[];
  deliveryNotes?: string;
  customerRating?: number; // 1-5 rating from customer
  deliveryProof?: {
    type: 'photo' | 'signature';
    url: string;
    uploadedAt: Date;
  };
}

/**
 * Call center commission tracking interface for agent commissions
 */
export interface CallCenterCommission {
  commission: number; // Commission amount in warehouse currency
  calculatedAt: Date; // When the commission was calculated
  isPaid: boolean; // Whether commission has been paid
  paidAt?: Date; // When commission was paid
  notes?: string; // Additional notes
}

/**
 * Discount tracking interface for price adjustments during confirmation
 */
export interface PriceAdjustment {
  productId: mongoose.Types.ObjectId;
  originalPrice: number;
  adjustedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  reason: string; // Reason for discount (e.g., "Customer negotiation", "Promotion", etc.)
  appliedBy: mongoose.Types.ObjectId; // Call center agent who applied the discount
  appliedAt: Date;
  notes?: string; // Additional notes about the discount
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
  doubleOrderRefrences:DoubleOrderReference[]
  // Call Tracking
  callAttempts: CallAttempt[];
  totalCallAttempts: number;
  lastCallAttempt?: Date;
  
  // Agent Assignment & Locking
  assignedAgent?: mongoose.Types.ObjectId; // Call center agent assigned to this order
  assignedAt?: Date; // When the order was assigned
  lockedBy?: mongoose.Types.ObjectId; // Agent currently working on this order
  lockedAt?: Date; // When the order was locked
  lockExpiry?: Date; // When the lock expires (auto-unlock)

  // Price Adjustments & Discounts
  priceAdjustments: PriceAdjustment[];
  finalTotalPrice: number; // Total price after all discounts applied
  totalDiscountAmount: number; // Sum of all discounts applied
  
  // Double Order Detection
  isDouble: boolean;
  doubleOrderReferences: DoubleOrderReference[];
  
  // Delivery Tracking
  deliveryTracking?: DeliveryTracking;
  isDeliveryRequired: boolean;
  deliveryAddress?: {
    latitude?: number;
    longitude?: number;
    address: string;
  };

  // Call Center Commission Tracking
  callCenterCommission?: CallCenterCommission;

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
      location: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
        },
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
      default: 0, // Add default value
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
      recording: {
        recordingId: {
          type: String,
          trim: true,
        },
        s3Bucket: {
          type: String,
          trim: true,
        },
        s3Key: {
          type: String,
          trim: true,
        },
        s3Url: {
          type: String,
          trim: true,
        },
        duration: {
          type: Number,
          min: [0, 'Duration cannot be negative'],
        },
        fileSize: {
          type: Number,
          min: [0, 'File size cannot be negative'],
        },
        mimeType: {
          type: String,
          trim: true,
        },
        recordedAt: {
          type: Date,
        },
        uploadedAt: {
          type: Date,
        },
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
    
    // Agent Assignment & Locking
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedAt: {
      type: Date,
    },
    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    lockedAt: {
      type: Date,
    },
    lockExpiry: {
      type: Date,
      index: true, // For cleanup queries
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
      orderNumber: {
        type: String,
        required: true,
        trim: true,
      },
      matchedRule: {
        type: String,
        required: true,
        trim: true,
      },
      detectedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Delivery Tracking
    deliveryTracking: {
      deliveryGuyId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      assignedAt: {
        type: Date,
      },
      acceptedAt: {
        type: Date,
      },
      pickedUpAt: {
        type: Date,
      },
      estimatedDeliveryTime: {
        type: Date,
      },
      actualDeliveryTime: {
        type: Date,
      },
      deliveryFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      commission: {
        type: Number,
        default: 0,
        min: 0,
      },
      distance: {
        type: Number,
        min: 0,
      },
      trackingNumber: {
        type: String,
        unique: true,
        sparse: true,
      },
      currentLocation: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
        },
        timestamp: {
          type: Date,
        },
      },
      route: [{
        latitude: {
          type: Number,
          required: true,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          required: true,
          min: -180,
          max: 180,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      }],
      deliveryNotes: {
        type: String,
        trim: true,
      },
      customerRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      deliveryProof: {
        type: {
          type: String,
          enum: ['photo', 'signature'],
        },
        url: {
          type: String,
          trim: true,
        },
        uploadedAt: {
          type: Date,
        },
      },
    },

    
    
    isDeliveryRequired: {
      type: Boolean,
      default: true,
    },
    
    deliveryAddress: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
      address: {
        type: String,
        trim: true,
      },
    },

    // Call Center Commission Tracking
    callCenterCommission: {
      commission: {
        type: Number,
        default: 0,
        min: 0,
      },
      calculatedAt: {
        type: Date,
      },
      isPaid: {
        type: Boolean,
        default: false,
        index: true, // For querying unpaid commissions
      },
      paidAt: {
        type: Date,
      },
      notes: {
        type: String,
        trim: true,
      },
    },

    // Timestamps
    orderDate: {
      type: Date,
      default: Date.now,
      index: true, // For double order detection queries
    },

    // Price Adjustments & Discounts
    priceAdjustments: [{
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      originalPrice: {
        type: Number,
        required: true,
        min: [0, 'Original price cannot be negative'],
      },
      adjustedPrice: {
        type: Number,
        required: true,
        min: [0, 'Adjusted price cannot be negative'],
      },
      discountAmount: {
        type: Number,
        required: true,
        min: [0, 'Discount amount cannot be negative'],
      },
      discountPercentage: {
        type: Number,
        required: true,
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100%'],
      },
      reason: {
        type: String,
        required: [true, 'Discount reason is required'],
        trim: true,
      },
      appliedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      appliedAt: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
        trim: true,
      },
    }],
    finalTotalPrice: {
      type: Number,
      min: [0, 'Final total price cannot be negative'],
      index: true,
    },
    totalDiscountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total discount amount cannot be negative'],
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
OrderSchema.index({ 'deliveryTracking.deliveryGuyId': 1 }); // For delivery guy queries
OrderSchema.index({ isDeliveryRequired: 1, status: 1 }); // For delivery assignment queries
OrderSchema.index({ assignedAgent: 1, status: 1, orderDate: -1 }); // For call center agent commission queries
OrderSchema.index({ 'callCenterCommission.isPaid': 1, assignedAgent: 1 }); // For unpaid commission queries

// Pre-save middleware to auto-generate order ID and tracking number
OrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderId) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  
  // Generate tracking number when delivery tracking is assigned
  if (this.deliveryTracking?.deliveryGuyId && !this.deliveryTracking.trackingNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.deliveryTracking.trackingNumber = `TRK-${timestamp}-${random}`;
  }
  
  next();
});

// Pre-save middleware to calculate total price (only if not already set)
OrderSchema.pre('save', function (next) {
  // Only calculate if totalPrice is not already set and we have products
  if ((this.totalPrice === 0 || this.totalPrice === undefined) && this.products && this.products.length > 0) {
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
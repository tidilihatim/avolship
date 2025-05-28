// src/lib/db/models/expedition.ts
import mongoose, { Document, Schema } from 'mongoose';
import { ExpeditionStatus, TransportMode, ProviderType } from '@/app/dashboard/_constant/expedition';

/**
 * Expedition product interface
 */
export interface ExpeditionProduct {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice?: number;
}

/**
 * Carrier information interface
 */
export interface CarrierInfo {
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
}

/**
 * Expedition interface based on requirements
 */
export interface IExpedition extends Document {
  expeditionCode: string; // Auto-generated unique code
  sellerId: mongoose.Types.ObjectId;
  sellerName: string; // Denormalized for performance
  
  // Package Information
  fromCountry: string;
  weight: number; // in KG
  expeditionDate: Date;
  transportMode: TransportMode;
  warehouseId: mongoose.Types.ObjectId;
  warehouseName: string; // Denormalized for performance
  
  // Provider Information
  providerType: ProviderType;
  providerId?: mongoose.Types.ObjectId; // Only for registered providers
  providerName?: string; // For registered providers
  carrierInfo?: CarrierInfo; // For own providers
  
  // Products
  products: ExpeditionProduct[];
  totalProducts: number;
  totalQuantity: number;
  totalValue?: number;
  
  // Status and Tracking
  status: ExpeditionStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedReason?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Expedition model
 */
const ExpeditionSchema = new Schema<IExpedition>(
  {
    expeditionCode: {
      type: String,
      unique: true,
      trim: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    sellerName: {
      type: String,
      required: [true, 'Seller name is required'],
      trim: true,
    },
    
    // Package Information
    fromCountry: {
      type: String,
      required: [true, 'From country is required'],
      trim: true,
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0.1, 'Weight must be at least 0.1 KG'],
    },
    expeditionDate: {
      type: Date,
      required: [true, 'Expedition date is required'],
    },
    transportMode: {
      type: String,
      enum: Object.values(TransportMode),
      required: [true, 'Transport mode is required'],
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
    },
    warehouseName: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    
    // Provider Information
    providerType: {
      type: String,
      enum: Object.values(ProviderType),
      required: [true, 'Provider type is required'],
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    providerName: {
      type: String,
      trim: true,
    },
    carrierInfo: {
      name: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      companyName: {
        type: String,
        trim: true,
      },
    },
    
    // Products
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'Product ID is required'],
        },
        productName: {
          type: String,
          required: [true, 'Product name is required'],
          trim: true,
        },
        productCode: {
          type: String,
          required: [true, 'Product code is required'],
          trim: true,
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1'],
        },
        unitPrice: {
          type: Number,
          min: [0, 'Unit price cannot be negative'],
        },
      },
    ],
    totalProducts: {
      type: Number,
      default: 0,
      min: [0, 'Total products cannot be negative'],
    },
    totalQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Total quantity cannot be negative'],
    },
    totalValue: {
      type: Number,
      default: 0,
      min: [0, 'Total value cannot be negative'],
    },
    
    // Status and Tracking
    status: {
      type: String,
      enum: Object.values(ExpeditionStatus),
      default: ExpeditionStatus.PENDING,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedReason: {
      type: String,
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
    },
    actualDelivery: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
ExpeditionSchema.index({ sellerId: 1, createdAt: -1 });
ExpeditionSchema.index({ status: 1 });
ExpeditionSchema.index({ warehouseId: 1 });
ExpeditionSchema.index({ expeditionDate: 1 });

// Pre-save middleware to calculate totals
ExpeditionSchema.pre('save', function (next) {
  if (this.products && this.products.length > 0) {
    this.totalProducts = this.products.length;
    this.totalQuantity = this.products.reduce((total, product) => total + product.quantity, 0);
    
    // Calculate total value if unit prices are available
    const hasAllPrices = this.products.every(product => product.unitPrice !== undefined);
    if (hasAllPrices) {
      this.totalValue = this.products.reduce(
        (total, product) => total + (product.unitPrice! * product.quantity),
        0
      );
    }
  } else {
    this.totalProducts = 0;
    this.totalQuantity = 0;
    this.totalValue = 0;
  }
  
  next();
});

// Pre-save middleware to auto-generate expedition code
ExpeditionSchema.pre('save', async function (next) {
  if (this.isNew && !this.expeditionCode) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.expeditionCode = `EXP-${timestamp}-${random}`;
  }
  next();
});

// Create the model only if it doesn't already exist
const Expedition = mongoose.models?.Expedition || mongoose.model<IExpedition>('Expedition', ExpeditionSchema);

export default Expedition;
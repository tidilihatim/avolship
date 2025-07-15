// src/lib/db/models/invoice.ts
import mongoose, { Document, Schema } from 'mongoose';
import { InvoiceStatus } from '@/types/invoice';

/**
 * Invoice fee breakdown interface
 */
export interface InvoiceFees {
  confirmationFee: number;
  serviceFee: number;
  warehouseFee: number;
  shippingFee: number;
  processingFee: number;
  expeditionFee: number;
  totalFees: number;
}

/**
 * Invoice summary interface
 */
export interface InvoiceSummary {
  totalOrders: number;
  totalExpeditions: number;
  totalProducts: number;
  totalQuantity: number;
  totalSales: number;
  totalFees: number;
  netAmount: number;
  totalTax: number;
  finalAmount: number;
  unpaidExpeditions: number;
  unpaidAmount: number;
}

/**
 * Invoice interface - simplified to rely on population
 */
export interface IInvoice extends Document {
  invoiceNumber: string;
  
  // Basic References
  sellerId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  
  // Date Period
  periodStart: Date;
  periodEnd: Date;
  
  // Status
  status: InvoiceStatus;
  
  // Included Orders - Track which specific orders are in this invoice
  orderIds: mongoose.Types.ObjectId[];
  
  // Included Expeditions - Track which specific expeditions are in this invoice
  expeditionIds: mongoose.Types.ObjectId[];
  
  // Fee Configuration
  fees: InvoiceFees;
  
  // Summary (calculated)
  summary: InvoiceSummary;
  
  // Currency
  currency: string;
  
  // Additional Information
  notes?: string;
  terms?: string;
  
  // Generation Info
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  
  // Payment Information
  dueDate?: Date;
  paidDate?: Date;
  paymentMethod?: string;
  paymentReference?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Invoice model
 */
const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    
    // Basic References
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
      index: true,
    },
    
    // Date Period
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
      index: true,
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required'],
      index: true,
    },
    
    // Status
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.DRAFT,
      index: true,
    },
    
    // Included Orders - Track which specific orders are in this invoice
    orderIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    }],
    
    // Included Expeditions - Track which specific expeditions are in this invoice
    expeditionIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Expedition',
      index: true,
    }],
    
    // Fee Configuration
    fees: {
      confirmationFee: {
        type: Number,
        default: 0,
        min: [0, 'Confirmation fee cannot be negative'],
      },
      serviceFee: {
        type: Number,
        default: 0,
        min: [0, 'Service fee cannot be negative'],
      },
      warehouseFee: {
        type: Number,
        default: 0,
        min: [0, 'Warehouse fee cannot be negative'],
      },
      shippingFee: {
        type: Number,
        default: 0,
        min: [0, 'Shipping fee cannot be negative'],
      },
      processingFee: {
        type: Number,
        default: 0,
        min: [0, 'Processing fee cannot be negative'],
      },
      expeditionFee: {
        type: Number,
        default: 0,
        min: [0, 'Expedition fee cannot be negative'],
      },
      totalFees: {
        type: Number,
        default: 0,
        min: [0, 'Total fees cannot be negative'],
      },
    },
    
    // Summary (calculated)
    summary: {
      totalOrders: {
        type: Number,
        default: 0,
        min: [0, 'Total orders cannot be negative'],
      },
      totalExpeditions: {
        type: Number,
        default: 0,
        min: [0, 'Total expeditions cannot be negative'],
      },
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
      totalSales: {
        type: Number,
        default: 0,
        min: [0, 'Total sales cannot be negative'],
      },
      totalFees: {
        type: Number,
        default: 0,
        min: [0, 'Total fees cannot be negative'],
      },
      netAmount: {
        type: Number,
        default: 0,
      },
      totalTax: {
        type: Number,
        default: 0,
        min: [0, 'Total tax cannot be negative'],
      },
      finalAmount: {
        type: Number,
        default: 0,
      },
      unpaidExpeditions: {
        type: Number,
        default: 0,
        min: [0, 'Unpaid expeditions cannot be negative'],
      },
      unpaidAmount: {
        type: Number,
        default: 0,
        min: [0, 'Unpaid amount cannot be negative'],
      },
    },
    
    // Currency
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
    },
    
    // Additional Information
    notes: {
      type: String,
      trim: true,
    },
    terms: {
      type: String,
      trim: true,
    },
    
    // Generation Info
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Generated by is required'],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    
    // Payment Information
    dueDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    paymentReference: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
InvoiceSchema.index({ sellerId: 1, createdAt: -1 });
InvoiceSchema.index({ warehouseId: 1, createdAt: -1 });
InvoiceSchema.index({ periodStart: 1, periodEnd: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ generatedBy: 1 });

// Validation for period dates
InvoiceSchema.pre('save', function (next) {
  if (this.periodStart && this.periodEnd && this.periodStart >= this.periodEnd) {
    return next(new Error('Period start date must be before period end date'));
  }
  next();
});

// Pre-save middleware to auto-generate invoice number
InvoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    this.invoiceNumber = `INV-${year}${month}-${timestamp}-${random}`;
  }
  next();
});

// Pre-save middleware to calculate fee totals
InvoiceSchema.pre('save', function (next) {
  this.fees.totalFees = 
    this.fees.confirmationFee +
    this.fees.serviceFee +
    this.fees.warehouseFee +
    this.fees.shippingFee +
    this.fees.processingFee +
    this.fees.expeditionFee;
  
  this.summary.totalFees = this.fees.totalFees;
  // Fix calculation: fees should be subtracted from seller payment
  this.summary.netAmount = this.summary.totalSales - this.summary.totalFees;
  this.summary.finalAmount = this.summary.netAmount + this.summary.totalTax;
  
  next();
});

// Create the model only if it doesn't already exist
const Invoice = mongoose.models?.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;
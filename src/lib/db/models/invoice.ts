// src/lib/db/models/invoice.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { InvoiceStatus } from '@/types/invoice';

/**
 * Custom fee interface for the debt-based system
 */
export interface CustomFee {
  id: string;
  name: string;
  amount: number;
}

/**
 * Manual expedition interface
 */
export interface ManualExpedition {
  id: string;
  expeditionId: string;
  weight: number;
  feePerKg: number;
  totalCost: number;
  originCountry: string;
  carrier: string;
  transportMode: 'air' | 'sea' | 'land';
  products: ExpeditionProduct[];
}

/**
 * Manual order interface
 */
export interface ManualOrder {
  orderId: string;
  include: boolean;
}

export interface ExpeditionProduct {
  productId: string;
  productName: string;
  quantity: number;
}

/**
 * Currency conversion interface
 */
export interface CurrencyConversion {
  enabled: boolean;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  convertedNetPayment: number;
  convertedTotalFees: number;
  convertedProfit: number;
}

/**
 * Previous debt reference
 */
export interface PreviousDebtReference {
  invoiceId: string;
  invoiceNumber: string;
  debtAmount: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Debt-based invoice fees (legacy + custom)
 */
export interface DebtInvoiceFees {
  // Legacy fees
  confirmationFee: number;
  serviceFee: number;
  warehouseFee: number;
  shippingFee: number;
  processingFee: number;
  expeditionFee: number;

  // Custom fees
  customFees: CustomFee[];

  // Hidden fees (not shown to seller)
  refundProcessingFees: number;

  // Totals
  totalLegacyFees: number;
  totalCustomFees: number;
  totalHiddenFees: number;
  totalFees: number;
}

/**
 * Debt-based invoice summary
 */
export interface DebtInvoiceSummary {
  // Basic counts
  totalOrders: number;
  totalExpeditions: number;
  totalProducts: number;
  totalQuantity: number;
  totalRefunds: number;

  // Financial calculations
  totalSales: number;
  totalExpeditionCosts: number;
  totalRefundAmount: number;
  totalCustomFees: number;
  totalHiddenFees: number;

  // Previous debt
  previousDebtAmount: number;
  includedPreviousDebts: PreviousDebtReference[];

  // Final debt calculation
  grossSales: number;
  totalDeductions: number; // Expeditions + hidden fees + custom fees
  netPayment: number; // Can be negative (debt)
  isDebt: boolean;

  // Currency conversion (if enabled)
  currencyConversion?: CurrencyConversion;
}

/**
 * Debt-based Invoice interface
 */
export interface IDebtInvoice extends Document {
  invoiceNumber: string;

  // Basic References
  sellerId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;

  // Date Period
  periodStart: Date;
  periodEnd: Date;

  // Status
  status: InvoiceStatus;

  // Included Items - Track what's in this invoice
  orderIds: mongoose.Types.ObjectId[];
  expeditionIds: mongoose.Types.ObjectId[];
  refundOrderIds: mongoose.Types.ObjectId[];

  // Manual expeditions added by admin
  manualExpeditions: ManualExpedition[];

  // Manual orders added by admin
  manualOrders: ManualOrder[];

  // Previous debt references
  includedPreviousDebts: PreviousDebtReference[];

  // Fee Configuration (debt-based)
  fees: DebtInvoiceFees;

  // Summary (calculated debt-based)
  summary: DebtInvoiceSummary;

  // Currency and conversion
  currency: string;
  currencyConversion?: CurrencyConversion;

  // Payment method
  paymentMethod: string;

  // Additional Information
  notes?: string;
  terms?: string;

  // Generation Info
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;

  // Payment Information
  dueDate?: Date;
  paidDate?: Date;
  paymentReference?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Static methods interface for Invoice model
 */
export interface IDebtInvoiceModel extends Model<IDebtInvoice> {
  // CRUD Operations
  createDebtInvoice(data: any): Promise<IDebtInvoice>;
  findBySellerAndPeriod(sellerId: string, startDate: Date, endDate: Date): Promise<IDebtInvoice[]>;
  findUnpaidDebtsBySeller(sellerId: string): Promise<IDebtInvoice[]>;
  updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<IDebtInvoice | null>;

  // Debt calculations
  calculateSellerTotalDebt(sellerId: string): Promise<number>;
  getSellerDebtHistory(sellerId: string, limit?: number): Promise<IDebtInvoice[]>;

  // Analytics
  getInvoicesByWarehouse(warehouseId: string, filters?: any): Promise<IDebtInvoice[]>;
  getInvoicesWithPagination(filters: any, page: number, limit: number): Promise<{
    invoices: IDebtInvoice[];
    total: number;
    totalPages: number;
  }>;
}

/**
 * Mongoose schema for Debt-based Invoice model
 */
const DebtInvoiceSchema = new Schema<IDebtInvoice>(
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

    // Included Items
    orderIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    }],
    expeditionIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Expedition',
      index: true,
    }],
    refundOrderIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    }],

    // Manual Expeditions
    manualExpeditions: [{
      expeditionId: {
        type: Schema.Types.ObjectId,
        ref: 'Expedition',
        required: true
      },
      feePerKg: { type: Number, required: true, min: 0 },
      totalCost: { type: Number, required: true, min: 0 },
    }],

    // Manual Orders
    manualOrders: [{
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
      },
      include: { type: Boolean, required: true, default: true },
    }],

    // Previous Debt References
    includedPreviousDebts: [{
      invoiceId: { type: String, required: true },
      invoiceNumber: { type: String, required: true },
      debtAmount: { type: Number, required: true },
      periodStart: { type: Date, required: true },
      periodEnd: { type: Date, required: true },
    }],

    // Debt-based Fee Configuration
    fees: {
      // Legacy fees
      confirmationFee: { type: Number, default: 0, min: 0 },
      serviceFee: { type: Number, default: 0, min: 0 },
      warehouseFee: { type: Number, default: 0, min: 0 },
      shippingFee: { type: Number, default: 0, min: 0 },
      processingFee: { type: Number, default: 0, min: 0 },
      expeditionFee: { type: Number, default: 0, min: 0 },

      // Custom fees
      customFees: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
      }],

      // Hidden fees
      refundProcessingFees: { type: Number, default: 0, min: 0 },

      // Totals
      totalLegacyFees: { type: Number, default: 0, min: 0 },
      totalCustomFees: { type: Number, default: 0, min: 0 },
      totalHiddenFees: { type: Number, default: 0, min: 0 },
      totalFees: { type: Number, default: 0, min: 0 },
    },

    // Debt-based Summary
    summary: {
      // Basic counts
      totalOrders: { type: Number, default: 0, min: 0 },
      totalExpeditions: { type: Number, default: 0, min: 0 },
      totalProducts: { type: Number, default: 0, min: 0 },
      totalQuantity: { type: Number, default: 0, min: 0 },
      totalRefunds: { type: Number, default: 0, min: 0 },

      // Financial calculations
      totalSales: { type: Number, default: 0, min: 0 },
      totalExpeditionCosts: { type: Number, default: 0, min: 0 },
      totalRefundAmount: { type: Number, default: 0, min: 0 },
      totalCustomFees: { type: Number, default: 0, min: 0 },
      totalHiddenFees: { type: Number, default: 0, min: 0 },

      // Previous debt
      previousDebtAmount: { type: Number, default: 0 },
      includedPreviousDebts: [{
        invoiceId: String,
        invoiceNumber: String,
        debtAmount: Number,
        periodStart: Date,
        periodEnd: Date,
      }],

      // Final debt calculation
      grossSales: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      netPayment: { type: Number, default: 0 }, // Can be negative
      isDebt: { type: Boolean, default: false },
    },

    // Currency and conversion
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
    },
    currencyConversion: {
      enabled: { type: Boolean, default: false },
      fromCurrency: String,
      toCurrency: String,
      rate: { type: Number, default: 1, min: 0 },
      convertedNetPayment: { type: Number, default: 0 },
      convertedTotalFees: { type: Number, default: 0 },
      convertedProfit: { type: Number, default: 0 },
    },

    // Payment method
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['cash', 'bank_transfer', 'mobile_money', 'check', 'credit_card', 'cryptocurrency'],
    },

    // Additional Information
    notes: { type: String, trim: true },
    terms: { type: String, trim: true },

    // Generation Info
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Generated by is required'],
    },
    generatedAt: { type: Date, default: Date.now },

    // Payment Information
    dueDate: Date,
    paidDate: Date,
    paymentReference: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
DebtInvoiceSchema.index({ sellerId: 1, createdAt: -1 });
DebtInvoiceSchema.index({ warehouseId: 1, createdAt: -1 });
DebtInvoiceSchema.index({ periodStart: 1, periodEnd: 1 });
DebtInvoiceSchema.index({ status: 1 });
DebtInvoiceSchema.index({ generatedBy: 1 });
DebtInvoiceSchema.index({ 'summary.isDebt': 1 });
DebtInvoiceSchema.index({ 'summary.netPayment': 1 });

// Validation for period dates
DebtInvoiceSchema.pre('save', function (next) {
  if (this.periodStart && this.periodEnd && this.periodStart >= this.periodEnd) {
    return next(new Error('Period start date must be before period end date'));
  }
  next();
});

// Pre-save middleware to auto-generate invoice number
DebtInvoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    this.invoiceNumber = `DINV-${year}${month}-${timestamp}-${random}`; // DINV for Debt Invoice
  }
  next();
});

// Pre-save middleware to calculate debt-based totals
DebtInvoiceSchema.pre('save', function (next) {
  // Skip calculation if summary already has netPayment (already calculated in preview)
  if (this.summary && this.summary.netPayment !== undefined && this.summary.netPayment !== null) {
    console.log('Skipping pre-save calculation - summary already complete');
    return next();
  }

  // Calculate legacy fees total
  this.fees.totalLegacyFees =
    this.fees.confirmationFee +
    this.fees.serviceFee +
    this.fees.warehouseFee +
    this.fees.shippingFee +
    this.fees.processingFee +
    this.fees.expeditionFee;

  // Calculate custom fees total
  this.fees.totalCustomFees = this.fees.customFees.reduce((sum, fee) => sum + fee.amount, 0);

  // Calculate hidden fees total
  this.fees.totalHiddenFees = this.fees.refundProcessingFees;

  // Calculate total fees
  this.fees.totalFees =
    this.fees.totalLegacyFees +
    this.fees.totalCustomFees +
    this.fees.totalHiddenFees;

  // Calculate debt-based summary (preserve existing values if already set)
  this.summary.totalCustomFees = this.summary.totalCustomFees || this.fees.totalCustomFees;
  this.summary.totalHiddenFees = this.summary.totalHiddenFees || this.fees.totalHiddenFees;
  this.summary.grossSales = this.summary.grossSales || this.summary.totalSales;

  // Preserve other summary values that may have been passed in during creation
  // (totalRefundAmount, previousDebtAmount, etc. should not be overridden)

  // Total deductions = expeditions + all fees + refunds + previous debt
  // This matches the preview calculation: totalFeesOwed = expeditionFeesOwed + serviceFees + totalRefundAmount + previousDebtAmount

  // Debug each component before calculation
  console.log('Pre-calculation debug:', {
    expeditionCosts: this.summary.totalExpeditionCosts,
    legacyFees: this.fees.totalLegacyFees,
    customFees: this.summary.totalCustomFees,
    hiddenFees: this.summary.totalHiddenFees,
    refundAmount: this.summary.totalRefundAmount,
    previousDebt: this.summary.previousDebtAmount
  });

  this.summary.totalDeductions =
    (this.summary.totalExpeditionCosts || 0) +
    (this.fees.totalLegacyFees || 0) +
    (this.summary.totalCustomFees || 0) +
    (this.summary.totalHiddenFees || 0) +
    (this.summary.totalRefundAmount || 0) +
    (this.summary.previousDebtAmount || 0);

  // Net payment = Sales - Total Deductions (matches preview: totalSales - totalFeesOwed)
  this.summary.netPayment =
    this.summary.grossSales -
    this.summary.totalDeductions;

  // Debug logging for net payment calculation
  console.log('Model Net Payment Calculation:', {
    grossSales: this.summary.grossSales,
    totalExpeditionCosts: this.summary.totalExpeditionCosts,
    totalLegacyFees: this.fees.totalLegacyFees,
    totalCustomFees: this.summary.totalCustomFees,
    totalHiddenFees: this.summary.totalHiddenFees,
    totalRefundAmount: this.summary.totalRefundAmount,
    previousDebtAmount: this.summary.previousDebtAmount,
    totalDeductions: this.summary.totalDeductions,
    netPayment: this.summary.netPayment
  });

  // Determine if this is debt (negative net payment)
  this.summary.isDebt = this.summary.netPayment < 0;

  // Calculate currency conversion if enabled
  if (this.currencyConversion?.enabled && this.currencyConversion?.rate) {
    this.currencyConversion.convertedNetPayment = this.summary.netPayment * this.currencyConversion.rate;
    this.currencyConversion.convertedTotalFees = this.fees.totalFees * this.currencyConversion.rate;
    this.currencyConversion.convertedProfit = Math.max(0, this.summary.netPayment) * this.currencyConversion.rate;
  }

  next();
});

/**
 * STATIC METHODS - All CRUD operations
 */

// Create a new debt-based invoice
DebtInvoiceSchema.statics.createDebtInvoice = async function(data: any): Promise<IDebtInvoice> {
  const invoice = new this(data);
  await invoice.save();
  return invoice;
};

// Find invoices by seller and period
DebtInvoiceSchema.statics.findBySellerAndPeriod = async function(
  sellerId: string,
  startDate: Date,
  endDate: Date
): Promise<IDebtInvoice[]> {
  return this.find({
    sellerId: new mongoose.Types.ObjectId(sellerId),
    periodStart: { $gte: startDate },
    periodEnd: { $lte: endDate },
  }).sort({ createdAt: -1 });
};

// Find all unpaid debts for a seller
DebtInvoiceSchema.statics.findUnpaidDebtsBySeller = async function(
  sellerId: string
): Promise<IDebtInvoice[]> {
  return this.find({
    sellerId: new mongoose.Types.ObjectId(sellerId),
    'summary.isDebt': true,
    status: { $ne: InvoiceStatus.PAID },
  }).sort({ createdAt: -1 });
};

// Update invoice status
DebtInvoiceSchema.statics.updateInvoiceStatus = async function(
  invoiceId: string,
  status: InvoiceStatus
): Promise<IDebtInvoice | null> {
  const updateData: any = { status };

  if (status === InvoiceStatus.PAID) {
    updateData.paidDate = new Date();
  }

  return this.findByIdAndUpdate(invoiceId, updateData, { new: true });
};

// Calculate seller's total debt
DebtInvoiceSchema.statics.calculateSellerTotalDebt = async function(
  sellerId: string
): Promise<number> {
  const debtInvoices = await this.find({
    sellerId: new mongoose.Types.ObjectId(sellerId),
    'summary.isDebt': true,
    status: { $ne: InvoiceStatus.PAID },
  });

  return debtInvoices.reduce((total:any, invoice:any) => {
    return total + Math.abs(invoice.summary.netPayment);
  }, 0);
};

// Get seller's debt history
DebtInvoiceSchema.statics.getSellerDebtHistory = async function(
  sellerId: string,
  limit: number = 10
): Promise<IDebtInvoice[]> {
  return this.find({
    sellerId: new mongoose.Types.ObjectId(sellerId),
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('generatedBy', 'name email')
  .populate('warehouseId', 'name country currency');
};

// Get invoices by warehouse
DebtInvoiceSchema.statics.getInvoicesByWarehouse = async function(
  warehouseId: string,
  filters: any = {}
): Promise<IDebtInvoice[]> {
  const query = {
    warehouseId: new mongoose.Types.ObjectId(warehouseId),
    ...filters,
  };

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('sellerId', 'name email businessName')
    .populate('generatedBy', 'name email');
};

// Get invoices with pagination
DebtInvoiceSchema.statics.getInvoicesWithPagination = async function(
  filters: any,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;
  const query: any = {};

  // Apply filters
  if (filters.sellerId) {
    query.sellerId = new mongoose.Types.ObjectId(filters.sellerId);
  }
  if (filters.warehouseId) {
    query.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.isDebt !== undefined) {
    query['summary.isDebt'] = filters.isDebt;
  }
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { invoiceNumber: searchRegex },
      { 'sellerId.name': searchRegex },
      { 'sellerId.email': searchRegex },
    ];
  }

  const [invoices, total] = await Promise.all([
    this.find(query)
      .populate('sellerId', 'name email businessName')
      .populate('warehouseId', 'name country currency')
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    invoices,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

// Create the model only if it doesn't already exist
const DebtInvoice = mongoose.models?.DebtInvoice || mongoose.model<IDebtInvoice, IDebtInvoiceModel>('DebtInvoice', DebtInvoiceSchema);

export default DebtInvoice;
import mongoose, { Document, Schema, Model } from 'mongoose';

export enum PaymentRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled'
}

export enum PaymentRequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface IPaymentRequest extends Document {
  sellerId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  description: string;
  requestedFromDate: Date;
  requestedToDate: Date;
  scheduledDate?: Date;
  processedDate?: Date;
  status: PaymentRequestStatus;
  priority: PaymentRequestPriority;

  // Admin/Moderator actions
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: PaymentRequestStatus;
  warehouseId?: mongoose.Types.ObjectId;
  priority?: PaymentRequestPriority;
  search?: string;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface IPaymentRequestModel extends Model<IPaymentRequest> {
  getSellerRequestsPaginated(sellerId: mongoose.Types.ObjectId, options: PaginationOptions): Promise<PaginatedResult<IPaymentRequest>>;
  getAllRequestsPaginated(options: PaginationOptions): Promise<PaginatedResult<IPaymentRequest>>;
  createRequest(data: Partial<IPaymentRequest>): Promise<IPaymentRequest>;
  updateRequestStatus(
    requestId: mongoose.Types.ObjectId,
    status: PaymentRequestStatus,
    reviewerId: mongoose.Types.ObjectId,
    notes?: string,
    scheduledDate?: Date
  ): Promise<IPaymentRequest | null>;
}

const PaymentRequestSchema = new Schema<IPaymentRequest>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    requestedFromDate: {
      type: Date,
      required: true,
    },
    requestedToDate: {
      type: Date,
      required: true,
    },
    scheduledDate: {
      type: Date,
      index: true,
    },
    processedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(PaymentRequestStatus),
      default: PaymentRequestStatus.PENDING,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(PaymentRequestPriority),
      default: PaymentRequestPriority.NORMAL,
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      maxlength: 1000,
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PaymentRequestSchema.index({ sellerId: 1, status: 1 });
PaymentRequestSchema.index({ warehouseId: 1, status: 1 });
PaymentRequestSchema.index({ status: 1, createdAt: -1 });
PaymentRequestSchema.index({ scheduledDate: 1, status: 1 });
PaymentRequestSchema.index({ reviewedBy: 1, reviewedAt: -1 });

// Static method to get seller's payment requests with pagination
PaymentRequestSchema.statics.getSellerRequestsPaginated = async function(
  sellerId: mongoose.Types.ObjectId,
  options: PaginationOptions
) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    warehouseId,
    priority,
    search
  } = options;

  const filter: any = { sellerId, isActive: true };

  if (status) {
    filter.status = status;
  }

  if (warehouseId) {
    filter.warehouseId = warehouseId;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (search) {
    filter.$or = [
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const skip = (page - 1) * limit;

  const [data, totalItems] = await Promise.all([
    this.find(filter)
      .populate('sellerId', 'name email businessName')
      .populate('warehouseId', 'name country city currency')
      .populate('reviewedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Static method to get all payment requests with pagination (Admin/Moderator)
PaymentRequestSchema.statics.getAllRequestsPaginated = async function(options: PaginationOptions) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    warehouseId,
    priority,
    search
  } = options;

  const filter: any = { isActive: true };

  if (status) {
    filter.status = status;
  }

  if (warehouseId) {
    filter.warehouseId = warehouseId;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (search) {
    filter.$or = [
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const skip = (page - 1) * limit;

  const [data, totalItems] = await Promise.all([
    this.find(filter)
      .populate('sellerId', 'name email businessName')
      .populate('warehouseId', 'name country city currency')
      .populate('reviewedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Static method to create a new payment request
PaymentRequestSchema.statics.createRequest = async function(data: Partial<IPaymentRequest>) {
  const paymentRequest = new this(data);
  return paymentRequest.save();
};

// Static method to update request status
PaymentRequestSchema.statics.updateRequestStatus = async function(
  requestId: mongoose.Types.ObjectId,
  status: PaymentRequestStatus,
  reviewerId: mongoose.Types.ObjectId,
  notes?: string,
  scheduledDate?: Date
) {
  const updateData: any = {
    status,
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    reviewNotes: notes,
  };

  if (status === PaymentRequestStatus.SCHEDULED && scheduledDate) {
    updateData.scheduledDate = scheduledDate;
  }

  if (status === PaymentRequestStatus.PROCESSED) {
    updateData.processedDate = new Date();
  }

  return this.findByIdAndUpdate(
    requestId,
    updateData,
    { new: true }
  )
    .populate('sellerId', 'name email businessName')
    .populate('warehouseId', 'name country city currency');
};


const PaymentRequest = (mongoose.models?.PaymentRequest ||
  mongoose.model<IPaymentRequest, IPaymentRequestModel>('PaymentRequest', PaymentRequestSchema)) as IPaymentRequestModel;

export default PaymentRequest;
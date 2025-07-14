import mongoose, { Document, Schema } from 'mongoose';

export interface ISourcingRequest extends Document {
  // Request Details
  requestNumber: string;
  sellerId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'NEGOTIATING' | 'APPROVED' | 'PAID' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  
  // Product Information
  productId: mongoose.Types.ObjectId;
  sourceLink: string;
  productName: string;
  productDescription: string;
  productImages: string[];
  category: string;
  specifications: Record<string, any>;
  
  // Sourcing Details
  quantity: number;
  targetPrice: number;
  currency: string;
  destinationWarehouse: mongoose.Types.ObjectId;
  requiredByDate: Date;
  sourcingCountry: string; // China, Turkey, Morocco, etc.
  preferredSupplierRegion?: string;
  
  // Provider Information
  providerId?: mongoose.Types.ObjectId;
  providerResponse?: {
    adjustedPrice?: number;
    adjustedQuantity?: number;
    deliveryDate?: Date;
    notes?: string;
    respondedAt?: Date;
  };
  
  // Negotiation History
  negotiations: Array<{
    senderId: mongoose.Types.ObjectId;
    senderRole: 'SELLER' | 'PROVIDER';
    message: string;
    priceOffer?: number;
    quantityOffer?: number;
    timestamp: Date;
  }>;
  
  // Approval & Payment
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  finalPrice?: number;
  finalQuantity?: number;
  
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentDetails?: {
    amount: number;
    method: string;
    transactionId: string;
    paidAt: Date;
    currency: string;
    paymentCountry?: string;
  };
  
  // Shipping Information
  shippingDetails?: {
    trackingNumber: string;
    carrier: string;
    shippedAt: Date;
    estimatedDelivery: Date;
    deliveredAt?: Date;
    expeditionStatus?: 'PENDING' | 'IN_TRANSIT' | 'CUSTOMS' | 'DELIVERED' | 'DELAYED';
    expeditionId?: string;
  };
  
  // Additional Information
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
  tags: string[];
  
  // Team Assignment
  assignedTo?: mongoose.Types.ObjectId; // Sourcing team member
  teamNotes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const SourcingRequestSchema = new Schema<ISourcingRequest>({
  requestNumber: {
    type: String,
    required: true,
    unique: true,
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'NEGOTIATING', 'APPROVED', 'PAID', 'SHIPPING', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING',
  },
  
  // Product Information
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  sourceLink: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productDescription: {
    type: String,
    required: true,
  },
  productImages: [{
    type: String,
  }],
  category: {
    type: String,
    required: true,
  },
  specifications: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {},
  },
  
  // Sourcing Details
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  targetPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
  },
  destinationWarehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  requiredByDate: {
    type: Date,
    required: true,
  },
  sourcingCountry: {
    type: String,
    required: true,
  },
  preferredSupplierRegion: {
    type: String,
  },
  
  // Provider Information
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  providerResponse: {
    adjustedPrice: Number,
    adjustedQuantity: Number,
    deliveryDate: Date,
    notes: String,
    respondedAt: Date,
  },
  
  // Negotiation History
  negotiations: [{
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['SELLER', 'PROVIDER'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priceOffer: Number,
    quantityOffer: Number,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Approval & Payment
  approvedAt: Date,
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  finalPrice: Number,
  finalQuantity: Number,
  
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'REFUNDED'],
    default: 'PENDING',
  },
  paymentDetails: {
    amount: Number,
    method: String,
    transactionId: String,
    paidAt: Date,
    currency: String,
    paymentCountry: String,
  },
  
  // Shipping Information
  shippingDetails: {
    trackingNumber: String,
    carrier: String,
    shippedAt: Date,
    estimatedDelivery: Date,
    deliveredAt: Date,
    expeditionStatus: {
      type: String,
      enum: ['PENDING', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED', 'DELAYED'],
      default: 'PENDING',
    },
    expeditionId: String,
  },
  
  // Additional Information
  urgencyLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
  },
  notes: String,
  tags: [{
    type: String,
  }],
  
  // Team Assignment
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  teamNotes: String,
}, {
  timestamps: true,
});

// Indexes
SourcingRequestSchema.index({ sellerId: 1, status: 1 });
SourcingRequestSchema.index({ providerId: 1, status: 1 });
SourcingRequestSchema.index({ productId: 1 });
SourcingRequestSchema.index({ requestNumber: 1 });
SourcingRequestSchema.index({ createdAt: -1 });
SourcingRequestSchema.index({ status: 1, urgencyLevel: 1 });
SourcingRequestSchema.index({ sourcingCountry: 1 });
SourcingRequestSchema.index({ assignedTo: 1 });
SourcingRequestSchema.index({ 'shippingDetails.expeditionStatus': 1 });

// Generate unique request number
SourcingRequestSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  const count = await this.constructor.countDocuments();
  this.requestNumber = `SRC-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  
  next();
});

// Virtual for status color
SourcingRequestSchema.virtual('statusColor').get(function() {
  const statusColors = {
    'PENDING': '#FFA500',
    'NEGOTIATING': '#3B82F6',
    'APPROVED': '#10B981',
    'PAID': '#6366F1',
    'SHIPPING': '#8B5CF6',
    'DELIVERED': '#059669',
    'CANCELLED': '#EF4444',
  };
  return statusColors[this.status] || '#6B7280';
});

const SourcingRequest = mongoose.models.SourcingRequest || mongoose.model<ISourcingRequest>('SourcingRequest', SourcingRequestSchema);

export default SourcingRequest;
// src/lib/db/models/orderStatusHistory.ts
import mongoose, { Document, Schema } from 'mongoose';
import { OrderStatus } from './order';

/**
 * Order Status History interface
 * Tracks all status changes for an order with detailed information
 */
export interface IOrderStatusHistory extends Document {
  orderId: mongoose.Types.ObjectId;
  
  // Status Change Information
  previousStatus?: OrderStatus;
  currentStatus: OrderStatus;
  changeDate: Date;
  
  // Time Management
  timeConsumedInPreviousStatus?: number; // Minutes spent in previous status
  
  // Change Details
  comment?: string; // Reason for status change
  changedBy?: mongoose.Types.ObjectId; // User who made the change (call center agent, admin, etc.)
  changedByRole?: string; // Role of the user who made the change
  
  // Additional Context
  automaticChange: boolean; // Whether this was an automatic system change
  changeReason?: string; // System reason for automatic changes
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Order Status History model
 */
const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },
    
    // Status Change Information
    previousStatus: {
      type: String,
      enum: Object.values(OrderStatus),
    },
    currentStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      required: [true, 'Current status is required'],
    },
    changeDate: {
      type: Date,
      default: Date.now,
      required: [true, 'Change date is required'],
    },
    
    // Time Management
    timeConsumedInPreviousStatus: {
      type: Number, // Minutes
      min: [0, 'Time consumed cannot be negative'],
    },
    
    // Change Details
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    changedByRole: {
      type: String,
      trim: true,
    },
    
    // Additional Context
    automaticChange: {
      type: Boolean,
      default: false,
    },
    changeReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
OrderStatusHistorySchema.index({ orderId: 1, changeDate: -1 });
OrderStatusHistorySchema.index({ currentStatus: 1, changeDate: -1 });
OrderStatusHistorySchema.index({ changedBy: 1 });

// Static method to create status history entry
OrderStatusHistorySchema.statics.createStatusChange = async function(
  orderId: mongoose.Types.ObjectId,
  previousStatus: OrderStatus | undefined,
  currentStatus: OrderStatus,
  changedBy?: mongoose.Types.ObjectId,
  comment?: string,
  automaticChange: boolean = false,
  changeReason?: string
) {
  let timeConsumedInPreviousStatus: number | undefined;
  
  // Calculate time consumed in previous status if there was a previous status
  if (previousStatus) {
    const lastHistoryEntry = await this.findOne(
      { orderId, currentStatus: previousStatus },
      {},
      { sort: { changeDate: -1 } }
    );
    
    if (lastHistoryEntry) {
      const timeDiff = Date.now() - lastHistoryEntry.changeDate.getTime();
      timeConsumedInPreviousStatus = Math.floor(timeDiff / (1000 * 60)); // Convert to minutes
    }
  }
  
  // Get user role if changedBy is provided
  let changedByRole: string | undefined;
  if (changedBy) {
    const User = mongoose.model('User');
    const user = await User.findById(changedBy);
    changedByRole = user?.role;
  }
  
  return this.create({
    orderId,
    previousStatus,
    currentStatus,
    changeDate: new Date(),
    timeConsumedInPreviousStatus,
    comment,
    changedBy,
    changedByRole,
    automaticChange,
    changeReason,
  });
};

// Static method to get order status timeline
OrderStatusHistorySchema.statics.getOrderTimeline = async function(orderId: mongoose.Types.ObjectId) {
  return this.find({ orderId })
    .populate('changedBy', 'name email role')
    .sort({ changeDate: 1 });
};

// Static method to get status duration analytics
OrderStatusHistorySchema.statics.getStatusDurationAnalytics = async function(
  orderId: mongoose.Types.ObjectId
) {
  const pipeline: mongoose.PipelineStage[] = [
    { $match: { orderId } },
    { $sort: { changeDate: 1 } },
    {
      $group: {
        _id: '$currentStatus',
        totalTimeInStatus: { $sum: '$timeConsumedInPreviousStatus' },
        statusChangeCount: { $sum: 1 },
        firstEntry: { $first: '$changeDate' },
        lastEntry: { $last: '$changeDate' },
      },
    },
  ];
  
  return this.aggregate(pipeline);
};

// Create the model only if it doesn't already exist
const OrderStatusHistory = mongoose.models?.OrderStatusHistory || 
  mongoose.model<IOrderStatusHistory>('OrderStatusHistory', OrderStatusHistorySchema);

export default OrderStatusHistory;
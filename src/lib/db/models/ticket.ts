import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITicket extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'account' | 'order' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  images: string[];
  attachments: {
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  tags: string[];
  relatedOrderId?: string;
  resolution?: string;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'account', 'order', 'general'],
    default: 'general',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      max: 10485760 // 10MB limit
    },
    mimeType: {
      type: String,
      required: true
    }
  }],
  tags: [{
    type: String,
    maxlength: 50
  }],
  relatedOrderId: {
    type: String,
    ref: 'Order'
  },
  resolution: {
    type: String,
    maxlength: 1000
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
TicketSchema.index({ createdBy: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ category: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ status: 1, priority: -1, createdAt: -1 });

// Virtual for ticket age
TicketSchema.virtual('age').get(function() {
  if (!this.createdAt) return 0;
  
  let createdDate: Date;
  if (this.createdAt instanceof Date) {
    createdDate = this.createdAt;
  } else if (typeof this.createdAt === 'string' || typeof this.createdAt === 'number') {
    createdDate = new Date(this.createdAt);
  } else {
    return 0; // Invalid date type
  }
  
  // Check if the date is valid
  if (isNaN(createdDate.getTime())) return 0;
  
  return Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
TicketSchema.pre('save', function(next) {
  if (this.status === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }
  next();
});

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
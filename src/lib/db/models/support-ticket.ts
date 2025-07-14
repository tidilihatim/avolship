import mongoose, { Document, Schema } from 'mongoose';

/**
 * Support ticket categories
 */
export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCOUNT = 'account',
  ORDERS = 'orders',
  SOURCING = 'sourcing',
  EXPEDITIONS = 'expeditions',
  INTEGRATIONS = 'integrations',
  GENERAL = 'general',
}

/**
 * Support ticket priorities
 */
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Support ticket status
 */
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  WAITING_INTERNAL = 'waiting_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * Customer satisfaction ratings
 */
export enum SatisfactionRating {
  VERY_UNSATISFIED = 1,
  UNSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

/**
 * Attachment interface for ticket files
 */
export interface ITicketAttachment {
  filename: string;
  originalName: string;
  cloudinaryUrl: string;
  publicId: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

/**
 * Internal note for support agents
 */
export interface IInternalNote {
  agentId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

/**
 * SLA (Service Level Agreement) tracking
 */
export interface ISLATracking {
  responseTimeTarget: number; // in minutes
  resolutionTimeTarget: number; // in minutes
  firstResponseAt?: Date;
  firstResponseDuration?: number; // in minutes
  resolvedAt?: Date;
  resolutionDuration?: number; // in minutes
  escalatedAt?: Date;
  escalationLevel: number; // 0 = not escalated, 1+ = escalation levels
}

/**
 * Customer satisfaction feedback
 */
export interface ICustomerFeedback {
  rating: SatisfactionRating;
  comment?: string;
  submittedAt: Date;
}

/**
 * Support ticket interface
 */
export interface ISupportTicket extends Document {
  // Basic Information
  ticketNumber: string; // Auto-generated unique identifier
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // User Information
  customerId: mongoose.Types.ObjectId; // Seller or Provider who created the ticket
  customerType: 'seller' | 'provider'; // Type of customer
  assignedAgentId?: mongoose.Types.ObjectId; // Support agent assigned to ticket
  
  // Content & Attachments
  attachments: ITicketAttachment[];
  tags: string[]; // For better categorization and search
  
  // Communication
  chatRoomId?: mongoose.Types.ObjectId; // Associated chat room for real-time communication
  lastMessageAt?: Date;
  messageCount: number;
  
  // Internal Management
  internalNotes: IInternalNote[];
  
  // SLA & Performance Tracking
  sla: ISLATracking;
  
  // Customer Satisfaction
  customerFeedback?: ICustomerFeedback;
  
  // Metadata
  source: 'web' | 'email' | 'chat' | 'phone'; // How the ticket was created
  relatedOrderId?: mongoose.Types.ObjectId; // If ticket is related to a specific order
  relatedSourcingRequestId?: mongoose.Types.ObjectId; // If ticket is related to sourcing
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

const AttachmentSchema = new Schema<ITicketAttachment>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const InternalNoteSchema = new Schema<IInternalNote>({
  agentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SLATrackingSchema = new Schema<ISLATracking>({
  responseTimeTarget: { type: Number, required: true, default: 60 }, // 1 hour default
  resolutionTimeTarget: { type: Number, required: true, default: 1440 }, // 24 hours default
  firstResponseAt: { type: Date },
  firstResponseDuration: { type: Number },
  resolvedAt: { type: Date },
  resolutionDuration: { type: Number },
  escalatedAt: { type: Date },
  escalationLevel: { type: Number, default: 0 }
});

const CustomerFeedbackSchema = new Schema<ICustomerFeedback>({
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5,
    enum: Object.values(SatisfactionRating)
  },
  comment: { type: String },
  submittedAt: { type: Date, default: Date.now }
});

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allow null values for uniqueness
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(TicketCategory),
    },
    priority: {
      type: String,
      required: true,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerType: {
      type: String,
      required: true,
      enum: ['seller', 'provider'],
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [AttachmentSchema],
    tags: [{ type: String, trim: true }],
    chatRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'SupportChatRoom',
    },
    lastMessageAt: { type: Date },
    messageCount: { type: Number, default: 0 },
    internalNotes: [InternalNoteSchema],
    sla: { type: SLATrackingSchema, required: true },
    customerFeedback: CustomerFeedbackSchema,
    source: {
      type: String,
      required: true,
      enum: ['web', 'email', 'chat', 'phone'],
      default: 'web',
    },
    relatedOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    relatedSourcingRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'SourcingRequest',
    },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
SupportTicketSchema.index({ customerId: 1, createdAt: -1 });
SupportTicketSchema.index({ assignedAgentId: 1, status: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
SupportTicketSchema.index({ category: 1, status: 1 });
SupportTicketSchema.index({ 'sla.escalationLevel': 1, status: 1 });
SupportTicketSchema.index({ tags: 1 });

// Pre-save middleware to generate ticket number
SupportTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.ticketNumber = `TK-${timestamp}-${randomSuffix}`;
    console.log('Generated ticket number:', this.ticketNumber);
  }
  next();
});

// Pre-save middleware to calculate SLA metrics
SupportTicketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    // Calculate first response time if moving from OPEN
    if (this.status !== TicketStatus.OPEN && !this.sla.firstResponseAt) {
      this.sla.firstResponseAt = now;
      this.sla.firstResponseDuration = Math.floor((now.getTime() - this.createdAt.getTime()) / (1000 * 60));
    }
    
    // Calculate resolution time if resolving
    if ((this.status === TicketStatus.RESOLVED || this.status === TicketStatus.CLOSED) && !this.sla.resolvedAt) {
      this.sla.resolvedAt = now;
      this.sla.resolutionDuration = Math.floor((now.getTime() - this.createdAt.getTime()) / (1000 * 60));
      this.closedAt = now;
    }
  }
  next();
});

// Static method to get SLA targets based on priority
SupportTicketSchema.statics.getSLATargets = function(priority: TicketPriority, customerType: 'seller' | 'provider') {
  const baseSLA = {
    [TicketPriority.CRITICAL]: { response: 15, resolution: 240 }, // 15 min, 4 hours
    [TicketPriority.HIGH]: { response: 60, resolution: 480 }, // 1 hour, 8 hours
    [TicketPriority.MEDIUM]: { response: 240, resolution: 1440 }, // 4 hours, 24 hours
    [TicketPriority.LOW]: { response: 480, resolution: 2880 }, // 8 hours, 48 hours
  };
  
  // Providers get faster SLA for business critical issues
  const multiplier = customerType === 'provider' ? 0.75 : 1;
  
  return {
    responseTimeTarget: Math.floor(baseSLA[priority].response * multiplier),
    resolutionTimeTarget: Math.floor(baseSLA[priority].resolution * multiplier),
  };
};

// Clear any cached model to ensure schema changes take effect
if (mongoose.models?.SupportTicket) {
  delete mongoose.models.SupportTicket;
}

const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;
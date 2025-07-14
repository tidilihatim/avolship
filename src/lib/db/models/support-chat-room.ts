import mongoose, { Document, Schema } from 'mongoose';

/**
 * Support chat room types
 */
export enum SupportChatType {
  TICKET_CHAT = 'ticket_chat', // Chat associated with a support ticket
  QUICK_CHAT = 'quick_chat', // Direct chat without a formal ticket
}

/**
 * Chat room status
 */
export enum ChatRoomStatus {
  ACTIVE = 'active',
  WAITING = 'waiting', // Customer waiting for agent
  PAUSED = 'paused', // Agent temporarily away
  CLOSED = 'closed',
}

/**
 * Agent online status
 */
export interface IAgentStatus {
  isOnline: boolean;
  lastSeenAt: Date;
  currentLoad: number; // Number of active chats
  maxCapacity: number; // Maximum concurrent chats
  availableForNewChats: boolean;
}

/**
 * Chat room participants
 */
export interface IChatParticipant {
  userId: mongoose.Types.ObjectId;
  role: 'customer' | 'agent' | 'supervisor';
  joinedAt: Date;
  lastReadAt?: Date;
  isTyping: boolean;
  isOnline: boolean;
}

/**
 * Chat session metrics
 */
export interface IChatMetrics {
  totalMessages: number;
  customerMessages: number;
  agentMessages: number;
  averageResponseTime: number; // in seconds
  customerSatisfactionRating?: number;
  transferCount: number;
  escalationCount: number;
}

/**
 * Canned response for quick replies
 */
export interface ICannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  usageCount: number;
}

/**
 * Support chat room interface extending the basic chat functionality
 */
export interface ISupportChatRoom extends Document {
  // Basic Information
  type: SupportChatType;
  status: ChatRoomStatus;
  
  // Relationships
  ticketId?: mongoose.Types.ObjectId; // Associated support ticket
  customerId: mongoose.Types.ObjectId; // Customer (seller/provider)
  assignedAgentId?: mongoose.Types.ObjectId; // Currently assigned agent
  
  // Participants
  participants: IChatParticipant[];
  
  // Chat Management
  queuePosition?: number; // Position in support queue
  estimatedWaitTime?: number; // in minutes
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Session Information
  sessionStartedAt: Date;
  sessionEndedAt?: Date;
  transferHistory: Array<{
    fromAgentId: mongoose.Types.ObjectId;
    toAgentId: mongoose.Types.ObjectId;
    reason: string;
    transferredAt: Date;
  }>;
  
  // Metrics and Analytics
  metrics: IChatMetrics;
  
  // Last Activity
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  lastCustomerMessageAt?: Date;
  lastAgentMessageAt?: Date;
  
  // Metadata
  source: 'widget' | 'dashboard' | 'ticket' | 'phone';
  customerInfo: {
    name: string;
    email: string;
    userType: 'seller' | 'provider';
    previousTickets: number;
  };
  
  // Auto-close settings
  autoCloseAfter?: number; // minutes of inactivity before auto-close
  warningNotificationSent: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ChatParticipantSchema = new Schema<IChatParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['customer', 'agent', 'supervisor'] 
  },
  joinedAt: { type: Date, default: Date.now },
  lastReadAt: { type: Date },
  isTyping: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: true }
});

const ChatMetricsSchema = new Schema<IChatMetrics>({
  totalMessages: { type: Number, default: 0 },
  customerMessages: { type: Number, default: 0 },
  agentMessages: { type: Number, default: 0 },
  averageResponseTime: { type: Number, default: 0 },
  customerSatisfactionRating: { type: Number, min: 1, max: 5 },
  transferCount: { type: Number, default: 0 },
  escalationCount: { type: Number, default: 0 }
});

const TransferHistorySchema = new Schema({
  fromAgentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toAgentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  transferredAt: { type: Date, default: Date.now }
});

const CustomerInfoSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  userType: { type: String, required: true, enum: ['seller', 'provider'] },
  previousTickets: { type: Number, default: 0 }
});

const SupportChatRoomSchema = new Schema<ISupportChatRoom>(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(SupportChatType),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(ChatRoomStatus),
      default: ChatRoomStatus.WAITING,
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'SupportTicket',
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    participants: [ChatParticipantSchema],
    queuePosition: { type: Number },
    estimatedWaitTime: { type: Number },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    sessionStartedAt: {
      type: Date,
      default: Date.now,
    },
    sessionEndedAt: { type: Date },
    transferHistory: [TransferHistorySchema],
    metrics: {
      type: ChatMetricsSchema,
      default: () => ({}),
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'SupportChatMessage',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastCustomerMessageAt: { type: Date },
    lastAgentMessageAt: { type: Date },
    source: {
      type: String,
      required: true,
      enum: ['widget', 'dashboard', 'ticket', 'phone'],
      default: 'widget',
    },
    customerInfo: {
      type: CustomerInfoSchema,
      required: true,
    },
    autoCloseAfter: { type: Number, default: 30 }, // 30 minutes default
    warningNotificationSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
SupportChatRoomSchema.index({ customerId: 1, createdAt: -1 });
SupportChatRoomSchema.index({ assignedAgentId: 1, status: 1 });
SupportChatRoomSchema.index({ status: 1, priority: 1, createdAt: 1 });
SupportChatRoomSchema.index({ ticketId: 1 });
SupportChatRoomSchema.index({ queuePosition: 1 });
SupportChatRoomSchema.index({ lastMessageAt: -1 });

// Method to calculate queue position
SupportChatRoomSchema.methods.updateQueuePosition = async function() {
  const position = await this.constructor.countDocuments({
    status: ChatRoomStatus.WAITING,
    createdAt: { $lt: this.createdAt },
    priority: { $gte: this.priority }
  });
  
  this.queuePosition = position + 1;
  return this.queuePosition;
};

// Method to estimate wait time based on queue and agent availability
SupportChatRoomSchema.methods.calculateEstimatedWaitTime = async function() {
  const User = mongoose.model('User');
  const availableAgents = await User.countDocuments({
    role: 'support',
    'agentStatus.isOnline': true,
    'agentStatus.availableForNewChats': true
  });
  
  if (availableAgents === 0) {
    this.estimatedWaitTime = 60; // 1 hour if no agents available
    return this.estimatedWaitTime;
  }
  
  const avgResponseTime = 5; // 5 minutes average per chat
  this.estimatedWaitTime = Math.ceil((this.queuePosition || 1) * avgResponseTime / availableAgents);
  return this.estimatedWaitTime;
};

// Static method to find next chat for agent assignment
SupportChatRoomSchema.statics.getNextChatForAgent = function() {
  return this.findOne({
    status: ChatRoomStatus.WAITING,
    assignedAgentId: { $exists: false }
  }).sort({ priority: -1, createdAt: 1 });
};

// Static method to get agent workload
SupportChatRoomSchema.statics.getAgentWorkload = function(agentId: mongoose.Types.ObjectId) {
  return this.countDocuments({
    assignedAgentId: agentId,
    status: { $in: [ChatRoomStatus.ACTIVE, ChatRoomStatus.PAUSED] }
  });
};

const SupportChatRoom = mongoose.models?.SupportChatRoom || mongoose.model<ISupportChatRoom>('SupportChatRoom', SupportChatRoomSchema);

export default SupportChatRoom;
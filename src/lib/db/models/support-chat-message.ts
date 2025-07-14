import mongoose, { Document, Schema } from 'mongoose';

/**
 * Support message types
 */
export enum SupportMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  PDF = 'pdf',
  SYSTEM = 'system',
  CANNED_RESPONSE = 'canned_response',
  INTERNAL_NOTE = 'internal_note',
}

/**
 * Message sender types
 */
export enum MessageSenderType {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  SYSTEM = 'system',
  BOT = 'bot',
}

/**
 * System message types for automated notifications
 */
export enum SystemMessageType {
  CHAT_STARTED = 'chat_started',
  AGENT_JOINED = 'agent_joined',
  AGENT_LEFT = 'agent_left',
  CHAT_TRANSFERRED = 'chat_transferred',
  CHAT_ESCALATED = 'chat_escalated',
  CHAT_ENDED = 'chat_ended',
  TICKET_CREATED = 'ticket_created',
  TICKET_UPDATED = 'ticket_updated',
  AUTO_RESPONSE = 'auto_response',
}

/**
 * Attachment interface for support messages
 */
export interface ISupportAttachment {
  filename: string;
  originalName: string;
  cloudinaryUrl: string;
  publicId: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl?: string; // For images
}

/**
 * Canned response metadata
 */
export interface ICannedResponseMeta {
  responseId: string;
  title: string;
  category: string;
}

/**
 * Message read receipt
 */
export interface IMessageReadReceipt {
  userId: mongoose.Types.ObjectId;
  readAt: Date;
}

/**
 * Support chat message interface
 */
export interface ISupportChatMessage extends Document {
  // Basic Information
  chatRoomId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: MessageSenderType;
  
  // Content
  messageType: SupportMessageType;
  content?: string;
  attachments: ISupportAttachment[];
  
  // System Message Details
  systemMessageType?: SystemMessageType;
  systemData?: Record<string, any>; // Additional data for system messages
  
  // Canned Response
  cannedResponseMeta?: ICannedResponseMeta;
  
  // Internal Notes (visible only to agents)
  isInternal: boolean;
  internalNoteCategory?: string;
  
  // Message Threading
  replyToMessageId?: mongoose.Types.ObjectId;
  threadId?: string;
  
  // Read Receipts and Status
  readReceipts: IMessageReadReceipt[];
  isRead: boolean; // Quick access for customer read status
  deliveredAt?: Date;
  
  // Response Time Tracking
  responseTime?: number; // Time in seconds from previous message
  isFirstResponse: boolean; // Is this the first agent response?
  
  // Message Metadata
  source: 'widget' | 'dashboard' | 'mobile' | 'email' | 'api';
  userAgent?: string;
  ipAddress?: string;
  
  // Content Moderation
  isFlagged: boolean;
  flagReason?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  
  // Translation Support
  originalLanguage?: string;
  translations?: Record<string, string>; // language code -> translated content
  
  // Editing and Deletion
  isEdited: boolean;
  editedAt?: Date;
  originalContent?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const SupportAttachmentSchema = new Schema<ISupportAttachment>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  thumbnailUrl: { type: String }
});

const CannedResponseMetaSchema = new Schema<ICannedResponseMeta>({
  responseId: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true }
});

const MessageReadReceiptSchema = new Schema<IMessageReadReceipt>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: { type: Date, required: true }
});

const SupportChatMessageSchema = new Schema<ISupportChatMessage>(
  {
    chatRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'SupportChatRoom',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderType: {
      type: String,
      required: true,
      enum: Object.values(MessageSenderType),
    },
    messageType: {
      type: String,
      required: true,
      enum: Object.values(SupportMessageType),
    },
    content: {
      type: String,
      trim: true,
    },
    attachments: [SupportAttachmentSchema],
    systemMessageType: {
      type: String,
      enum: Object.values(SystemMessageType),
    },
    systemData: {
      type: Schema.Types.Mixed,
    },
    cannedResponseMeta: CannedResponseMetaSchema,
    isInternal: {
      type: Boolean,
      default: false,
    },
    internalNoteCategory: {
      type: String,
    },
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'SupportChatMessage',
    },
    threadId: {
      type: String,
    },
    readReceipts: [MessageReadReceiptSchema],
    isRead: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    responseTime: {
      type: Number, // in seconds
    },
    isFirstResponse: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      required: true,
      enum: ['widget', 'dashboard', 'mobile', 'email', 'api'],
      default: 'widget',
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    originalLanguage: {
      type: String,
    },
    translations: {
      type: Schema.Types.Mixed,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    originalContent: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
SupportChatMessageSchema.index({ chatRoomId: 1, createdAt: -1 });
SupportChatMessageSchema.index({ senderId: 1, createdAt: -1 });
SupportChatMessageSchema.index({ senderType: 1, messageType: 1 });
SupportChatMessageSchema.index({ isInternal: 1 });
SupportChatMessageSchema.index({ replyToMessageId: 1 });
SupportChatMessageSchema.index({ threadId: 1 });
SupportChatMessageSchema.index({ isFlagged: 1 });
SupportChatMessageSchema.index({ isDeleted: 1 });

// Pre-save middleware to calculate response time
SupportChatMessageSchema.pre('save', async function(next) {
  if (this.isNew && this.senderType === MessageSenderType.AGENT) {
    // Find the last customer message in this chat room
    const lastCustomerMessage = await this.constructor.findOne({
      chatRoomId: this.chatRoomId,
      senderType: MessageSenderType.CUSTOMER,
      createdAt: { $lt: this.createdAt },
      isDeleted: false
    }).sort({ createdAt: -1 });
    
    if (lastCustomerMessage) {
      this.responseTime = Math.floor((this.createdAt.getTime() - lastCustomerMessage.createdAt.getTime()) / 1000);
      
      // Check if this is the first agent response
      const previousAgentMessages = await this.constructor.countDocuments({
        chatRoomId: this.chatRoomId,
        senderType: MessageSenderType.AGENT,
        createdAt: { $lt: this.createdAt },
        isDeleted: false
      });
      
      this.isFirstResponse = previousAgentMessages === 0;
    }
  }
  next();
});

// Post-save middleware to update chat room last message
SupportChatMessageSchema.post('save', async function() {
  if (!this.isDeleted && !this.isInternal) {
    const SupportChatRoom = mongoose.model('SupportChatRoom');
    await SupportChatRoom.findByIdAndUpdate(this.chatRoomId, {
      lastMessage: this._id,
      lastMessageAt: this.createdAt,
      ...(this.senderType === MessageSenderType.CUSTOMER && { lastCustomerMessageAt: this.createdAt }),
      ...(this.senderType === MessageSenderType.AGENT && { lastAgentMessageAt: this.createdAt }),
    });
    
    // Update message count in chat room metrics
    await SupportChatRoom.findByIdAndUpdate(this.chatRoomId, {
      $inc: {
        'metrics.totalMessages': 1,
        ...(this.senderType === MessageSenderType.CUSTOMER && { 'metrics.customerMessages': 1 }),
        ...(this.senderType === MessageSenderType.AGENT && { 'metrics.agentMessages': 1 }),
      }
    });
  }
});

// Method to mark message as read by user
SupportChatMessageSchema.methods.markAsRead = function(userId: mongoose.Types.ObjectId) {
  const existingReceipt = this.readReceipts.find(
    (receipt: IMessageReadReceipt) => receipt.userId.toString() === userId.toString()
  );
  
  if (!existingReceipt) {
    this.readReceipts.push({
      userId,
      readAt: new Date()
    });
    
    // Update isRead if this is marked as read by customer
    if (this.senderType === MessageSenderType.AGENT) {
      this.isRead = true;
    }
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to get unread message count for a user in a chat room
SupportChatMessageSchema.statics.getUnreadCount = function(
  chatRoomId: mongoose.Types.ObjectId, 
  userId: mongoose.Types.ObjectId
) {
  return this.countDocuments({
    chatRoomId,
    senderId: { $ne: userId },
    isDeleted: false,
    isInternal: false,
    'readReceipts.userId': { $ne: userId }
  });
};

// Static method to get average response time for an agent
SupportChatMessageSchema.statics.getAverageResponseTime = function(
  agentId: mongoose.Types.ObjectId,
  dateRange?: { start: Date; end: Date }
) {
  const matchStage: any = {
    senderId: agentId,
    senderType: MessageSenderType.AGENT,
    responseTime: { $exists: true, $gt: 0 },
    isDeleted: false
  };
  
  if (dateRange) {
    matchStage.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        averageResponseTime: { $avg: '$responseTime' },
        totalResponses: { $sum: 1 }
      }
    }
  ]);
};

const SupportChatMessage = mongoose.models?.SupportChatMessage || mongoose.model<ISupportChatMessage>('SupportChatMessage', SupportChatMessageSchema);

export default SupportChatMessage;
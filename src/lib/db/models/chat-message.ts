import mongoose, { Document, Schema } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  PDF = 'pdf',
  SYSTEM = 'system',
  VOICE = 'voice',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export interface IAttachment {
  filename: string;
  originalName: string;
  cloudinaryUrl: string;
  publicId: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl?: string;
}

export interface IMessageReaction {
  emoji: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IChatMessage extends Document {
  chatRoom: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  messageType: MessageType;
  content?: string;
  attachments?: IAttachment[];
  
  // Modern features
  replyTo?: mongoose.Types.ObjectId; // Reference to another message
  isPinned: boolean;
  isEdited: boolean;
  editedAt?: Date;
  editHistory?: Array<{
    content: string;
    editedAt: Date;
    editedBy: mongoose.Types.ObjectId;
  }>;
  
  reactions: IMessageReaction[];
  status: MessageStatus;
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  
  // Legacy compatibility
  isRead: boolean;
  readAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  thumbnailUrl: { type: String }
});

const ReactionSchema = new Schema<IMessageReaction>({
  emoji: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const EditHistorySchema = new Schema({
  content: { type: String, required: true },
  editedAt: { type: Date, default: Date.now },
  editedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const ReadBySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: { type: Date, default: Date.now }
});

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    chatRoom: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      required: true
    },
    content: {
      type: String,
      required: function() {
        return this.messageType === MessageType.TEXT;
      }
    },
    attachments: [AttachmentSchema],
    
    // Modern features
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'ChatMessage',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    editHistory: [EditHistorySchema],
    reactions: [ReactionSchema],
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    readBy: [ReadBySchema],
    
    // Legacy compatibility
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    deletedAt: {
      type: Date,
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
ChatMessageSchema.index({ chatRoom: 1, createdAt: -1 });
ChatMessageSchema.index({ sender: 1 });
ChatMessageSchema.index({ isPinned: 1, chatRoom: 1 });
ChatMessageSchema.index({ replyTo: 1 });
ChatMessageSchema.index({ 'readBy.userId': 1 });

// Method to add reaction
ChatMessageSchema.methods.addReaction = function(emoji: string, userId: mongoose.Types.ObjectId) {
  const existingReaction = this.reactions.find((r: IMessageReaction) => 
    r.emoji === emoji && r.userId.toString() === userId.toString()
  );
  
  if (!existingReaction) {
    this.reactions.push({ emoji, userId, createdAt: new Date() });
  }
  
  return this.save();
};

// Method to remove reaction
ChatMessageSchema.methods.removeReaction = function(emoji: string, userId: mongoose.Types.ObjectId) {
  this.reactions = this.reactions.filter((r: IMessageReaction) => 
    !(r.emoji === emoji && r.userId.toString() === userId.toString())
  );
  
  return this.save();
};

// Method to mark as read by user
ChatMessageSchema.methods.markAsRead = function(userId: mongoose.Types.ObjectId) {
  const alreadyRead = this.readBy.find((r: any) => 
    r.userId.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({ userId, readAt: new Date() });
    this.status = MessageStatus.READ;
    // Update legacy field for compatibility
    if (!this.isRead) {
      this.isRead = true;
      this.readAt = new Date();
    }
  }
  
  return this.save();
};

// Method to edit message (with history)
ChatMessageSchema.methods.editMessage = function(newContent: string, editedBy: mongoose.Types.ObjectId) {
  // Save current content to history
  this.editHistory.push({
    content: this.content,
    editedAt: this.editedAt || this.createdAt,
    editedBy: this.sender
  });
  
  // Update message
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  
  return this.save();
};

// Clear any cached model to ensure schema changes take effect
if (mongoose.models?.ChatMessage) {
  delete mongoose.models.ChatMessage;
}

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
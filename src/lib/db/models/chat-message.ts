import mongoose, { Document, Schema } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  PDF = 'pdf'
}

export interface IAttachment {
  filename: string;
  originalName: string;
  s3Url: string;
  s3Key: string;
  fileType: string;
  fileSize: number;
}

export interface IChatMessage extends Document {
  chatRoom: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  messageType: MessageType;
  content?: string;
  attachments?: IAttachment[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  s3Url: { type: String, required: true },
  s3Key: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true }
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
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

ChatMessageSchema.index({ chatRoom: 1, createdAt: -1 });
ChatMessageSchema.index({ sender: 1 });

const ChatMessage = mongoose.models?.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
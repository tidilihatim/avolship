import mongoose, { Document, Schema } from 'mongoose';

export interface IChatRoom extends Document {
  seller: mongoose.Types.ObjectId;
  provider: mongoose.Types.ObjectId;
  isActive: boolean;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'ChatMessage'
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

ChatRoomSchema.index({ seller: 1, provider: 1 }, { unique: true });
ChatRoomSchema.index({ lastActivity: -1 });

const ChatRoom = mongoose.models?.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

export default ChatRoom;
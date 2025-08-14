import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITicketMessage extends Document {
  _id: Types.ObjectId;
  ticketId: Types.ObjectId;
  senderId: Types.ObjectId;
  message: string;
  messageType: 'text' | 'image' | 'file';
  attachments: {
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  images: string[];
  isInternal: boolean; // For internal notes between support staff
  readBy: {
    userId: Types.ObjectId;
    readAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema: Schema = new Schema({
  ticketId: {
    type: Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: function(this: ITicketMessage) {
      // Message is only required if there are no images or attachments
      return !(this.images && this.images.length > 0) && !(this.attachments && this.attachments.length > 0);
    },
    maxlength: 2000,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text',
    required: true
  },
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
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  isInternal: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
TicketMessageSchema.index({ ticketId: 1, createdAt: 1 });
TicketMessageSchema.index({ senderId: 1 });
TicketMessageSchema.index({ ticketId: 1, isInternal: 1 });

export const TicketMessage = mongoose.models.TicketMessage || mongoose.model<ITicketMessage>('TicketMessage', TicketMessageSchema);
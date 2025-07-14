// src/models/Notification.ts

import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from './user';

/**
 * Notification types for different events
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  ORDER = 'order',
  DELIVERY = 'delivery',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  CHAT = 'chat'
}

export enum NotificationIcon {
  BELL = "bell",
  CHECK_CIRCLE = "check-circle",
  ALERT_TRIANGLE = "alert-triangle",
  X_CIRCLE = "x-circle",
  SHOPPING_CART = "shopping-cart",
  TRUCK = "truck",
  CREDIT_CARD = "credit-card",
  SETTINGS = "settings",
  MESSAGE_CIRCLE = "message-circle"
}

/**
 * Interface for Notification document
 */
export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  icon: NotificationIcon;
  actionLink?: string;
  metadata?: Record<string, any>;
}

/**
 * Mongoose schema for Notification model
 */
const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.INFO
    },
    icon: {
      type: String,
      enum: Object.values(NotificationIcon),
      default: NotificationIcon.BELL
    },
    read: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date
    },
    actionLink: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true // Automatically add createdAt and updatedAt fields
  }
);

// Create indexes for better query performance
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion
NotificationSchema.index({ userId: 1, createdAt: -1 }); // For user notification lists
NotificationSchema.index({ userId: 1, type: 1, read: 1 }); // For filtered queries
NotificationSchema.index({ type: 1, createdAt: -1 }); // For admin monitoring

// Create the model only if it doesn't already exist
const Notification = mongoose.models?.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
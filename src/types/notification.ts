// src/types/notifications.ts

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

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  icon?: string;
  actionLink?: string;
  metadata?: Record<string, any>;
  expiresInDays?: number;
}
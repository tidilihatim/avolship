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

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.INFO]: 'Information',
  [NotificationType.SUCCESS]: 'Success',
  [NotificationType.WARNING]: 'Warnings',
  [NotificationType.ERROR]: 'Errors',
  [NotificationType.ORDER]: 'Orders',
  [NotificationType.DELIVERY]: 'Delivery',
  [NotificationType.PAYMENT]: 'Payments',
  [NotificationType.SYSTEM]: 'System',
  [NotificationType.CHAT]: 'Chat Messages'
};

export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
  [NotificationType.INFO]: 'General information and updates',
  [NotificationType.SUCCESS]: 'Success confirmations and achievements',
  [NotificationType.WARNING]: 'Important warnings and alerts',
  [NotificationType.ERROR]: 'Error notifications and failures',
  [NotificationType.ORDER]: 'Order updates and status changes',
  [NotificationType.DELIVERY]: 'Delivery status and shipping updates',
  [NotificationType.PAYMENT]: 'Payment confirmations and issues',
  [NotificationType.SYSTEM]: 'System maintenance and updates',
  [NotificationType.CHAT]: 'New messages and chat notifications'
};
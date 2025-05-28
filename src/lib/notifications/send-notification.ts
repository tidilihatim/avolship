// src/lib/notifications/sendNotification.ts

import { NotificationType } from "@/types/notification";
import {sendNotification as sendNotificationAction, sendNotificationToUserType as sendNotificationToUserTypeAction} from '@/app/actions/notification'


interface SendNotificationProps {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  icon?: string;
  actionLink?: string;
  metadata?: Record<string, any>;
  expiresInDays?: number;
}

/**
 * Helper function to send a notification to a user
 * This can be called from anywhere in the application
 */
export async function sendNotification(params: SendNotificationProps) {
  return sendNotificationAction(params);
}


/**
 * Helpe function to send a notification to all sepecific user types
 */
export async function sendNotificationToUserType(role: string, params: Omit<SendNotificationProps, 'userId'>) {
  return sendNotificationToUserTypeAction(role, params);
}
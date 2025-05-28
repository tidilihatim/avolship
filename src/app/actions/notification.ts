// src/app/actions/notificationActions.ts
'use server'

import { withDbConnection } from '@/lib/db/db-connect';
import Notification, { NotificationType } from '@/lib/db/models/notification';
import { authOptions } from '@/config/auth';
import { getServerSession } from 'next-auth';

/**
 * Interface for sending a notification
 */
interface SendNotificationParams {
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
 * Send a notification to a specific user
 */
export async function sendNotification(params: SendNotificationParams) {
  try {
    const API_URL = process.env.API_URL || 'http://localhost:4000';
    
    const response = await fetch(`${API_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': `${process.env.SOCKET_SERVER_API_SECRET_KEY}` // For server-to-server authentication
      },
      body: JSON.stringify(params),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}


/**
 * Send a notification to a specific user type
 */

export async function sendNotificationToUserType(role: string, params: Omit<SendNotificationParams, 'userId'>) {
  try {
    const API_URL = process.env.API_URL || 'http://localhost:4000';
    
    const response = await fetch(`${API_URL}/api/notifications/send/types/${role}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': `${process.env.SOCKET_SERVER_API_SECRET_KEY}` // For server-to-server authentication
      },
      body: JSON.stringify(params),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

/**
 * Get notifications for the logged-in user
 */
export const getLoggedInUserNotifications = withDbConnection(async (limit: number = 10, skip: number = 0) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('User not found');
    }

    const notifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return {
      success: true,
      notifications: JSON.parse(JSON.stringify(notifications)),
      message: 'Notifications fetched successfully',
      hasMore: notifications.length === limit // If we got exactly the limit, there might be more
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      success: false,
      notifications: [],
      message: 'Failed to fetch notifications',
      hasMore: false
    };
  }
});

/**
 * Mark a specific notification as read
 */
export const markNotificationAsRead = withDbConnection(async (notificationId: string) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('User not found');
    }

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId, 
        userId: session.user.id 
      },
      { 
        read: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return {
        success: false,
        message: 'Notification not found'
      };
    }

    return {
      success: true,
      notification: JSON.parse(JSON.stringify(notification)),
      message: 'Notification marked as read'
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      message: 'Failed to mark notification as read'
    };
  }
});

/**
 * Mark all notifications as read for the logged-in user
 */
export const markAllNotificationsAsRead = withDbConnection(async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('User not found');
    }

    const result = await Notification.updateMany(
      { 
        userId: session.user.id,
        read: false
      },
      { 
        read: true,
        readAt: new Date()
      }
    );

    return {
      success: true,
      modifiedCount: result.modifiedCount,
      message: 'All notifications marked as read'
    };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return {
      success: false,
      message: 'Failed to mark all notifications as read'
    };
  }
});

/**
 * Get unread notification count for the logged-in user
 */
export const getUnreadNotificationCount = withDbConnection(async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('User not found');
    }

    const count = await Notification.countDocuments({ 
      userId: session.user.id,
      read: false
    });

    return {
      success: true,
      count,
      message: 'Unread count fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return {
      success: false,
      count: 0,
      message: 'Failed to fetch unread count'
    };
  }
});

/**
 * Delete a specific notification
 */
export const deleteNotification = withDbConnection(async (notificationId: string) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('User not found');
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: session.user.id
    });

    if (!notification) {
      return {
        success: false,
        message: 'Notification not found'
      };
    }

    return {
      success: true,
      message: 'Notification deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return {
      success: false,
      message: 'Failed to delete notification'
    };
  }
});
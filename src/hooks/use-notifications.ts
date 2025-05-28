// src/hooks/use-notifications.ts

'use client'

import { useState, useEffect, useCallback, useTransition } from 'react';
import { LucideIcon, Bell, CheckCircle, AlertTriangle, XCircle, ShoppingCart, Truck, CreditCard, Settings, MessageCircle } from 'lucide-react';
import { NotificationType } from '@/lib/db/models/notification';
import { useSocket } from '@/lib/socket/use-socket';
import { 
  getLoggedInUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount 
} from '@/app/actions/notification';

// Map of icon components by name
const iconMap: Record<string, LucideIcon> = {
  'bell': Bell,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  'x-circle': XCircle,
  'shopping-cart': ShoppingCart,
  'truck': Truck,
  'credit-card': CreditCard,
  'settings': Settings,
  'message-circle': MessageCircle
};

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  icon: LucideIcon;
  read: boolean;
  time: string | Date;
  actionLink?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { socket, isConnected, on } = useSocket();

  const NOTIFICATIONS_PER_PAGE = 10;

  // Get icon component from name
  const getIconComponent = useCallback((iconName: string): LucideIcon => {
    return iconMap[iconName] || Bell;
  }, []);

  // Convert raw notification data to Notification type with icon component
  const formatNotification = useCallback((notification: any): Notification => {
    return {
      ...notification,
      _id: notification._id || notification.id, // Ensure we have an ID
      icon: getIconComponent(notification.icon || 'bell'),
      time: new Date(notification.time || notification.createdAt)
    };
  }, [getIconComponent]);

  // Fetch initial notifications using server action
  const fetchNotifications = useCallback(async (limit = NOTIFICATIONS_PER_PAGE) => {
    console.log('Fetching initial notifications...');
    setLoading(true);
    setCurrentPage(0);

    try {
      const result = await getLoggedInUserNotifications(limit, 0);
      
      if (result.success) {
        const formattedNotifications = result.notifications.map(formatNotification);
        setNotifications(formattedNotifications);

        // Calculate unread count
        const unread = formattedNotifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);

        // Check if there are more notifications to load
        setHasMore(result.notifications.length === limit);
        setCurrentPage(1);
      } else {
        console.log('No notifications received');
        setNotifications([]);
        setUnreadCount(0);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [formatNotification]);

  // Load more notifications for pagination
  const loadMoreNotifications = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const skip = currentPage * NOTIFICATIONS_PER_PAGE;
      const result = await getLoggedInUserNotifications(NOTIFICATIONS_PER_PAGE, skip);
      
      if (result.success && result.notifications.length > 0) {
        const formattedNotifications = result.notifications.map(formatNotification);
        
        // Append new notifications to existing ones
        setNotifications(prev => {
          // Filter out any duplicates (just in case)
          const existingIds = new Set(prev.map(n => n._id));
          const newNotifications = formattedNotifications.filter((n:any) => !existingIds.has(n._id));
          return [...prev, ...newNotifications];
        });

        // Update pagination state
        setCurrentPage(prev => prev + 1);
        
        // Check if there are more notifications to load
        setHasMore(result.notifications.length === NOTIFICATIONS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, loadingMore, hasMore, formatNotification]);

  // Mark notification as read using server action
  const markAsRead = useCallback(async (notificationId: string) => {
    // First, optimistically update the UI immediately
    setNotifications(prev =>
      prev.map(notif =>
        notif._id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    );

    // Update unread count optimistically
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Then call server action to persist the change
    try {
      const result = await markNotificationAsRead(notificationId);
      
      if (!result.success) {
        // Revert the optimistic update
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, read: false }
              : notif
          )
        );
        
        // Revert unread count
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      // Revert the optimistic update
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, read: false }
            : notif
        )
      );
      
      // Revert unread count
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Mark all notifications as read using server action
  const markAllAsRead = useCallback(() => {
    // First, optimistically update the UI immediately
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);

    // Then call server action to persist the changes
    startTransition(async () => {
      try {
        const result = await markAllNotificationsAsRead();
        
        if (!result.success) {
          console.error('Failed to mark all notifications as read on server:', result.message);
          
          // Optionally, you could revert the changes here or show a toast error
          // For now, we'll keep the optimistic update since it's unlikely to fail
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }, []);

  // Refresh unread count using server action
  const refreshUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadNotificationCount();
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  }, []);

  // Reset pagination and fetch fresh notifications
  const refreshNotifications = useCallback(() => {
    setNotifications([]);
    setCurrentPage(0);
    setHasMore(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up socket listeners for real-time notifications only
  useEffect(() => {
    if (!socket) {
      console.log('No socket instance available');
      return;
    }

    // Listen for new notifications (real-time)
    const newNotificationCleanup = on('notification', (data) => {
      const newNotification = formatNotification(data);

      // Play notification sound
      try {
        const notificationSound = new Audio('/sounds/notification.mp3');
        notificationSound.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (e) {
        console.log('Audio not available:', e);
      }

      // Change meta Title for some time
      const oldTitle = document.title;
      document.title = `🔔 New Notification: ${newNotification.title}`;
      setTimeout(() => {
        document.title = oldTitle;
      }, 5000);

      // Add new notification to the beginning of the list
      setNotifications(prev => {
        // Check if notification already exists to avoid duplicates
        const exists = prev.find(n => n._id === newNotification._id);
        if (exists) {
          console.log('Notification already exists, skipping duplicate');
          return prev;
        }

        return [newNotification, ...prev];
      });

      // Increment unread count only if the notification is unread
      if (!newNotification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Listen for global unread count updates (optional, for multiple tabs sync)
    const unreadCountCleanup = on('unreadNotificationCount', (data) => {
      if (typeof data === 'number') {
        setUnreadCount(data);
      } else if (data && typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    });

    return () => {
      newNotificationCleanup();
      unreadCountCleanup();
    };
  }, [socket, on, formatNotification]);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reset loading if socket disconnects (but still allow server actions to work)
  useEffect(() => {
    if (!isConnected && loading) {
      console.log('Socket disconnected while loading, but server actions still work');
      // Don't reset loading here, let fetchNotifications handle it
    }
  }, [isConnected, loading]);

  return {
    notifications,
    unreadCount,
    loading: loading || isPending,
    loadingMore,
    hasMore,
    fetchNotifications: refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount
  };
}
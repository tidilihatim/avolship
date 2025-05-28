// src/components/layout/NotificationPopover.tsx

'use client'

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Loader2 } from 'lucide-react';
import { NotificationType } from '@/lib/db/models/notification';
import { useNotifications, Notification as AppNotification } from '@/hooks/use-notifications';

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.SUCCESS:
      return 'border-l-green-500';
    case NotificationType.WARNING:
      return 'border-l-yellow-500';
    case NotificationType.ERROR:
      return 'border-l-red-500';
    case NotificationType.ORDER:
      return 'border-l-blue-500';
    case NotificationType.DELIVERY:
      return 'border-l-purple-500';
    case NotificationType.PAYMENT:
      return 'border-l-emerald-500';
    case NotificationType.CHAT:
      return 'border-l-pink-500';
    case NotificationType.INFO:
    case NotificationType.SYSTEM:
    default:
      return 'border-l-gray-500';
  }
};

const getNotificationIconStyle = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.SUCCESS:
      return 'bg-green-100 text-green-500';
    case NotificationType.WARNING:
      return 'bg-yellow-100 text-yellow-500';
    case NotificationType.ERROR:
      return 'bg-red-100 text-red-500';
    case NotificationType.ORDER:
      return 'bg-blue-100 text-blue-500';
    case NotificationType.DELIVERY:
      return 'bg-purple-100 text-purple-500';
    case NotificationType.PAYMENT:
      return 'bg-emerald-100 text-emerald-500';
    case NotificationType.CHAT:
      return 'bg-pink-100 text-pink-500';
    case NotificationType.INFO:
    case NotificationType.SYSTEM:
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

export function NotificationPopover() {
  const t = useTranslations();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    loadMoreNotifications
  } = useNotifications();

  // Handle scroll event for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Check if user has scrolled near the bottom (within 100px)
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (nearBottom && hasMore && !loadingMore && !loading) {
      loadMoreNotifications();
    }
  }, [hasMore, loadingMore, loading, loadMoreNotifications]);

  // Mark notification as read when clicked
  const handleNotificationClick = (notification: AppNotification) => {
  
    // Only mark as read if it's not already read
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate to action link if provided
    if (notification.actionLink) {
      // Close popover first
      setNotificationsOpen(false);
      
      // Then navigate
      setTimeout(() => {
        window.location.href = notification.actionLink!;
      }, 100);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  // Refresh notifications
  const handleRefresh = () => {
    // Reset scroll position when refreshing
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    fetchNotifications();
  };

  // Format notification time
  const formatTime = (time: string | Date): string => {
    const date = new Date(time);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Just now';
    }
    
    // If today, show just time
    if (new Date().toDateString() === date.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show date and time without year
    if (new Date().getFullYear() === date.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise, show full date
    return date.toLocaleDateString();
  };

  return (
    <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative cursor-pointer hover:bg-muted transition-colors p-2"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs p-0 flex items-center justify-center border-2 border-background shadow-lg">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 mr-4" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {t("dashboard.navbar.notifications.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.navbar.notifications.unreadCount", {
                  count: unreadCount,
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Loading...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="max-h-80 overflow-y-auto"
          onScroll={handleScroll}
        >
          {loading && notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              {t("common.loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {t("dashboard.navbar.notifications.empty")}
            </div>
          ) : (
            <>
              {notifications.map((notification, index) => {
                // Ensure we have a valid key
                const key = notification._id || `notification-${index}-${Date.now()}`;
                
                return (
                  <div
                    key={key}
                    className={`p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer border-l-4 ${getNotificationColor(
                      notification.type
                    )} ${!notification.read ? 'bg-muted/20' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${getNotificationIconStyle(
                          notification.type
                        )}`}
                      >
                        <notification.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div 
                              className="w-2 h-2 bg-primary rounded-full flex-shrink-0"
                              title="Unread notification"
                            ></div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatTime(notification.time)}
                          </p>
                          {notification.read && (
                            <p className="text-xs text-muted-foreground/70">
                              Read
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Loading more indicator */}
              {loadingMore && (
                <div className="p-4 text-center text-muted-foreground border-b border-border">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading more notifications...</span>
                  </div>
                </div>
              )}
              
              {/* No more notifications indicator */}
              {!hasMore && notifications.length > 0 && !loadingMore && (
                <div className="p-4 text-center text-muted-foreground/70 border-b border-border">
                  <p className="text-xs">No more notifications</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-3 border-t border-border bg-muted/30 flex justify-between">
          <Button
            variant="ghost"
            className="text-sm text-primary hover:bg-primary/10"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || loading}
          >
            {t("dashboard.navbar.notifications.markAllRead")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
'use client';

import { useAdNotifications } from '@/hooks/use-ad-notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize ad notifications
  useAdNotifications();
  
  return <>{children}</>;
}
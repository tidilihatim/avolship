'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Bell, Mail, Smartphone, Loader2 } from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// Types
interface NotificationSettings {
  inAppNotifications: boolean;
  emailNotifications: boolean;
}

interface NotificationSettingsResponse {
  success: boolean;
  data?: {
    notificationSettings: NotificationSettings;
  };
  message?: string;
}

export default function NotificationSettings() {
  const t = useTranslations('settings.notifications');
  
  // State
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch('/api/seller/notification-settings');
      const data: NotificationSettingsResponse = await response.json();
      
      if (data.success && data.data) {
        setSettings(data.data.notificationSettings);
      } else {
        // Set default values if no settings exist
        setSettings({
          inAppNotifications: true,
          emailNotifications: true
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error(t('messages.errorLoading'));
      // Set default values on error
      setSettings({
        inAppNotifications: true,
        emailNotifications: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = async (setting: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      
      const updatedSettings = {
        ...settings,
        [setting]: value
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/seller/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationSettings: updatedSettings }),
      });

      const data: NotificationSettingsResponse = await response.json();

      if (data.success) {
        setSettings(updatedSettings);
        toast.success(t('messages.settingsSaved'));
      } else {
        toast.error(data.message || t('messages.errorSaving'));
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error(t('messages.errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('loadFailed')}</h3>
        <p className="text-muted-foreground mb-4">
          {t('loadFailedDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('preferences.title')}</CardTitle>
          <CardDescription>
            {t('preferences.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* In-App Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="in-app-notifications" className="text-base font-medium">
                  {t('inAppNotifications.title')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('inAppNotifications.description')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                id="in-app-notifications"
                checked={settings.inAppNotifications}
                onCheckedChange={(checked) => handleSettingChange('inAppNotifications', checked)}
                disabled={isSaving}
              />
            </div>
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email-notifications" className="text-base font-medium">
                  {t('emailNotifications.title')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('emailNotifications.description')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('summary.title')}</CardTitle>
          <CardDescription>
            {t('summary.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <div className={`w-3 h-3 rounded-full ${
                settings.inAppNotifications ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm font-medium">
                {t('inAppNotifications.title')}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <div className={`w-3 h-3 rounded-full ${
                settings.emailNotifications ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm font-medium">
                {t('emailNotifications.title')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overview Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
      </Card>

      {/* Preferences Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="w-11 h-6 rounded-full" />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="w-11 h-6 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Summary Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
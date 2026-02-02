'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Bell, Loader2 } from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

// Types and Constants
import { NotificationType } from '@/lib/constants/notification-types';
import { NotificationTypePreference } from '@/lib/db/models/seller-settings';

// Components
import { NotificationTypePreferenceComponent } from './notification-type-preference';

// Actions
import { getNotificationSettings, updateNotificationSettings } from '@/app/actions/seller-settings';

interface NotificationSettings {
  preferences: Record<NotificationType, NotificationTypePreference>;
  updatedAt: string;
}


export default function NotificationSettings() {
  const t = useTranslations('settings.notifications');

  // State
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await getNotificationSettings();

      if (response.success && response.data) {
        setSettings(response.data.notificationSettings);
      } else {
        // Set default values if no settings exist
        const defaultPreferences = {} as Record<NotificationType, NotificationTypePreference>;
        Object.values(NotificationType).forEach(type => {
          defaultPreferences[type] = { inApp: true, email: true };
        });

        setSettings({
          preferences: defaultPreferences,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error(t('messages.errorLoading'));

      // Set default values on error
      const defaultPreferences = {} as Record<NotificationType, NotificationTypePreference>;
      Object.values(NotificationType).forEach(type => {
        defaultPreferences[type] = { inApp: true, email: true };
      });

      setSettings({
        preferences: defaultPreferences,
        updatedAt: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (type: NotificationType, preference: NotificationTypePreference) => {
    if (!settings) return;

    setSettings(prev => prev ? {
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: preference
      }
    } : prev);

    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!settings || !hasUnsavedChanges) return;

    try {
      setIsSaving(true);

      const response = await updateNotificationSettings(settings.preferences);

      if (response.success) {
        setSettings(prev => prev ? {
          ...prev,
          updatedAt: new Date().toISOString()
        } : prev);
        setHasUnsavedChanges(false);
        toast.success(t('messages.settingsSaved'));
      } else {
        toast.error(response.message || t('messages.errorSaving'));
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
        <h3 className="text-lg font-medium mb-2">{t('messages.loadFailed')}</h3>
        <p className="text-muted-foreground mb-4">
          {t('messages.loadFailedDescription')}
        </p>
        <Button onClick={loadSettings} variant="outline">
          {t('messages.errorLoading')}
        </Button>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('preferences.title')}</CardTitle>
              <CardDescription>
                {t('preferences.description')}
              </CardDescription>
            </div>

            {/* Save Button */}
            {hasUnsavedChanges && (
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                size="sm"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSaving ? t('saving') : t('saveChanges')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.values(NotificationType).map((type, index) => (
            <div key={type}>
              <NotificationTypePreferenceComponent
                type={type}
                preference={settings.preferences[type]}
                onPreferenceChange={handlePreferenceChange}
                disabled={isSaving}
              />
              {index < Object.values(NotificationType).length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* In-App Notifications Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {t('channels.inApp')}
              </h4>
              <div className="space-y-1">
                {Object.entries(settings.preferences).map(([type, preference]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t(`types.${type}.title`)}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      preference.inApp ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Email Notifications Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {t('channels.email')}
              </h4>
              <div className="space-y-1">
                {Object.entries(settings.preferences).map(([type, preference]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t(`types.${type}.title`)}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      preference.email ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  </div>
                ))}
              </div>
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
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-24 w-full rounded-lg" />
              {i < 8 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
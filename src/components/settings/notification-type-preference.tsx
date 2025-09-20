'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { NotificationType } from '@/lib/constants/notification-types';
import { NotificationTypePreference } from '@/lib/db/models/seller-settings';
import { useTranslations } from 'next-intl';
import { Bell, Mail } from 'lucide-react';

interface NotificationTypePreferenceProps {
  type: NotificationType;
  preference: NotificationTypePreference;
  onPreferenceChange: (type: NotificationType, preference: NotificationTypePreference) => void;
  disabled?: boolean;
}

export function NotificationTypePreferenceComponent({
  type,
  preference,
  onPreferenceChange,
  disabled = false
}: NotificationTypePreferenceProps) {
  const t = useTranslations('settings.notifications');

  const handleInAppChange = (checked: boolean) => {
    onPreferenceChange(type, {
      ...preference,
      inApp: checked
    });
  };

  const handleEmailChange = (checked: boolean) => {
    onPreferenceChange(type, {
      ...preference,
      email: checked
    });
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Notification Type Header */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-foreground">
              {t(`types.${type}.title`)}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t(`types.${type}.description`)}
            </p>
          </div>

          {/* Preference Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* In-App Notification Toggle */}
            <div className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-card/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-sm bg-primary/10">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <Label
                    htmlFor={`${type}-inapp`}
                    className="text-xs font-medium cursor-pointer"
                  >
                    {t('channels.inApp')}
                  </Label>
                </div>
              </div>
              <Switch
                id={`${type}-inapp`}
                checked={preference.inApp}
                onCheckedChange={handleInAppChange}
                disabled={disabled}
              />
            </div>

            {/* Email Notification Toggle */}
            <div className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-card/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-sm bg-primary/10">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <Label
                    htmlFor={`${type}-email`}
                    className="text-xs font-medium cursor-pointer"
                  >
                    {t('channels.email')}
                  </Label>
                </div>
              </div>
              <Switch
                id={`${type}-email`}
                checked={preference.email}
                onCheckedChange={handleEmailChange}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
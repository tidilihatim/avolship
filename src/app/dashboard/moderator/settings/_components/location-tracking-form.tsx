"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Users, Phone } from 'lucide-react';

interface LocationTrackingSettings {
  seller: boolean;
  call_center: boolean;
}

interface LocationTrackingFormProps {
  settings: LocationTrackingSettings;
  onSettingsChange: (settings: LocationTrackingSettings) => void;
}

export function LocationTrackingForm({ settings, onSettingsChange }: LocationTrackingFormProps) {
  const t = useTranslations('settings.tracking');
  
  const updateSetting = (key: keyof LocationTrackingSettings, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {t('title')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('seller.title')}
            </CardTitle>
            <CardDescription>
              {t('seller.cardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="seller-tracking">{t('seller.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('seller.switchDescription')}
                </p>
              </div>
              <Switch
                id="seller-tracking"
                checked={settings.seller}
                onCheckedChange={(checked) => updateSetting('seller', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t('callCenter.title')}
            </CardTitle>
            <CardDescription>
              {t('callCenter.cardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="call-center-tracking">{t('callCenter.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('callCenter.switchDescription')}
                </p>
              </div>
              <Switch
                id="call-center-tracking"
                checked={settings.call_center}
                onCheckedChange={(checked) => updateSetting('call_center', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
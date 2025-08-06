"use client";

import React from 'react';
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
          Location Tracking Visibility
        </h3>
        <p className="text-sm text-muted-foreground">
          Control which user roles can view real-time location tracking information
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Seller Access
            </CardTitle>
            <CardDescription>
              Allow sellers to view location tracking information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="seller-tracking">Enable for Sellers</Label>
                <p className="text-sm text-muted-foreground">
                  Sellers will be able to see delivery personnel locations and track order progress
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
              Call Center Access
            </CardTitle>
            <CardDescription>
              Allow call center staff to view location tracking information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="call-center-tracking">Enable for Call Center</Label>
                <p className="text-sm text-muted-foreground">
                  Call center staff will be able to see delivery personnel locations for customer support
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
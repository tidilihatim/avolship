'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function AdsPreferences() {
  const [showAds, setShowAds] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load preferences from localStorage
    const showAdsPreference = localStorage.getItem('seller_show_ads');
    const animationPreference = localStorage.getItem('seller_ads_animation');
    
    if (showAdsPreference !== null) {
      setShowAds(showAdsPreference === 'true');
    }
    if (animationPreference !== null) {
      setAnimationEnabled(animationPreference === 'true');
    }
    setLoading(false);
  }, []);

  const handleShowAdsChange = (checked: boolean) => {
    setShowAds(checked);
    localStorage.setItem('seller_show_ads', checked.toString());
    toast.success(checked ? 'Featured ads enabled' : 'Featured ads disabled');
  };

  const handleAnimationChange = (checked: boolean) => {
    setAnimationEnabled(checked);
    localStorage.setItem('seller_ads_animation', checked.toString());
    toast.success(checked ? 'Ad animations enabled' : 'Ad animations disabled');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advertisement Preferences</CardTitle>
          <CardDescription>Control how featured provider ads appear on your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advertisement Preferences</CardTitle>
        <CardDescription>Control how featured provider ads appear on your dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="show-ads" className="text-base">
              Show Featured Provider Ads
            </Label>
            <p className="text-sm text-muted-foreground">
              Display featured provider advertisements on your dashboard
            </p>
          </div>
          <Switch
            id="show-ads"
            checked={showAds}
            onCheckedChange={handleShowAdsChange}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="animation" className="text-base">
              Enable Ad Animations
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically cycle through featured ads with smooth animations
            </p>
          </div>
          <Switch
            id="animation"
            checked={animationEnabled}
            onCheckedChange={handleAnimationChange}
            disabled={!showAds}
          />
        </div>
        
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> These preferences are saved locally on this device. 
            Featured ads help connect you with quality shipping providers and services.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
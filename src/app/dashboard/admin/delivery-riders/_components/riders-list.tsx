'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, MapPin, Clock, Navigation, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DeliveryRider } from '../_hooks/useDeliveryRiders';

interface RidersListProps {
  riders: DeliveryRider[];
  loading: boolean;
  error: string | null;
  onTrackRider: (rider: DeliveryRider) => void;
}

export const RidersList: React.FC<RidersListProps> = ({
  riders,
  loading,
  error,
  onTrackRider
}) => {
  const t = useTranslations('deliveryRiders.list');
  const formatLastSeen = (lastActive?: Date) => {
    if (!lastActive) return t('unknown');
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('justNow');
    if (diffInMinutes < 60) return t('minutesAgo', { minutes: diffInMinutes });
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('hoursAgo', { hours: diffInHours });
    const diffInDays = Math.floor(diffInHours / 24);
    return t('daysAgo', { days: diffInDays });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-medium text-destructive mb-2">{t('errorLoading')}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {riders.map((rider) => (
            <div 
              key={rider.id} 
              className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors ${
                rider.isOnline ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/20'
              }`}
              onClick={() => onTrackRider(rider)}
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                    rider.isOnline ? 'bg-primary' : 'bg-destructive'
                  }`} />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-lg">{rider.name}</p>
                    <Badge variant={rider.isOnline ? "default" : "secondary"} className="text-xs">
                      {rider.isOnline ? t('online') : t('offline')}
                    </Badge>
                    {rider.isOnline && (
                      <Badge variant={rider.isAvailableForDelivery ? "default" : "outline"} className="text-xs">
                        {rider.isAvailableForDelivery ? t('available') : t('busy')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{rider.email}</p>
                  {rider.country && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {rider.country}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('activeOrders', { count: rider.assignedOrders?.length || 0 })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right text-sm">
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLastSeen(rider.lastActive)}
                  </p>
                  {rider.deliveryStats && (
                    <p className="text-muted-foreground">
                      {t('deliveriesToday', { count: rider.deliveryStats.todayDeliveries })}
                    </p>
                  )}
                  {rider.currentLocation ? (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t('locationAvailable')}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t('noLocationData')}
                    </p>
                  )}
                </div>
                
                <Button variant="outline" size="sm">
                  <Navigation className="h-4 w-4 mr-2" />
                  {t('track')}
                </Button>
              </div>
            </div>
          ))}
          
          {riders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{t('noRidersFound')}</p>
              <p className="text-sm">{t('adjustFilters')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
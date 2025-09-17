'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Activity, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DeliveryRider } from '../_hooks/useDeliveryRiders';

interface RidersStatsProps {
  riders: DeliveryRider[];
  totalRiders: number;
}

export const RidersStats: React.FC<RidersStatsProps> = ({ riders, totalRiders }) => {
  const t = useTranslations('deliveryRiders.stats');
  const onlineRiders = riders.filter(rider => rider.isOnline);
  const availableRiders = onlineRiders.filter(rider => rider.isAvailableForDelivery);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('totalRiders')}</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRiders}</div>
          <p className="text-xs text-muted-foreground">
            {t('totalRidersDescription')}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('onlineNow')}</CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{onlineRiders.length}</div>
          <p className="text-xs text-muted-foreground">
            {t('onlineNowDescription')}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('availableForDelivery')}</CardTitle>
          <Truck className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{availableRiders.length}</div>
          <p className="text-xs text-muted-foreground">
            {t('availableForDeliveryDescription')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
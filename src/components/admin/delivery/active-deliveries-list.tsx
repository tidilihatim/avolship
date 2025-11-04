'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader2 } from 'lucide-react';

interface ActiveDeliveriesListProps {
  initialCount: number;
}

export const ActiveDeliveriesList: React.FC<ActiveDeliveriesListProps> = ({
  initialCount,
}) => {
  const t = useTranslations('adminDeliveryDashboard');
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(initialCount);
  const previousDataRef = useRef({ riderId: '', count: initialCount });

  useEffect(() => {
    const currentRiderId = searchParams.get('riderId') || '';
    const { riderId: prevRiderId, count: prevCount } = previousDataRef.current;

    // Rider filter changed - show loading
    if (prevRiderId !== '' && prevRiderId !== currentRiderId) {
      setIsLoading(true);
    }

    // Data arrived (either riderId matches current or initialCount changed)
    if (currentRiderId === prevRiderId || initialCount !== prevCount) {
      setIsLoading(false);
      setDisplayCount(initialCount);
      previousDataRef.current = { riderId: currentRiderId, count: initialCount };
    }
  }, [searchParams, initialCount]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {t('activeDeliveries.title')}
        </CardTitle>
        <Truck className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('activeDeliveries.loading')}</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{displayCount}</div>
            <p className="text-xs text-muted-foreground">
              {t('activeDeliveries.ordersOutForDelivery')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

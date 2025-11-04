'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

interface ZoneData {
  latitude: number;
  longitude: number;
  total: number;
  failed: number;
  failurePercentage: number;
}

interface ReturnsPerZoneMapProps {
  data: ZoneData[];
}

// Dynamically import the map to avoid SSR issues
const MapView = dynamic(
  () => import('./returns-per-zone-map-view'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full flex items-center justify-center bg-muted/20 rounded-md">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

export function ReturnsPerZoneMap({ data }: ReturnsPerZoneMapProps) {
  const t = useTranslations('adminDeliveryDashboard.charts.returnsPerZone');

  // Calculate summary stats
  const totalDeliveries = useMemo(() => data.reduce((sum, zone) => sum + zone.total, 0), [data]);
  const totalFailed = useMemo(() => data.reduce((sum, zone) => sum + zone.failed, 0), [data]);
  const overallFailureRate = useMemo(
    () => (totalDeliveries > 0 ? Math.round((totalFailed / totalDeliveries) * 100 * 10) / 10 : 0),
    [totalDeliveries, totalFailed]
  );

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[500px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <MapView data={data} />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Legend */}
          <div className="col-span-2 md:col-span-4">
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <span className="font-medium">{t('legend')}:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>0-10%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>10-25%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>25-50%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>50%+</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="text-center p-3 bg-muted/20 rounded-md">
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">{t('totalZones')}</p>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-md">
            <div className="text-2xl font-bold">{totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">{t('totalDeliveries')}</p>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-md">
            <div className="text-2xl font-bold">{totalFailed}</div>
            <p className="text-xs text-muted-foreground">{t('totalFailed')}</p>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-md">
            <div className="text-2xl font-bold">{overallFailureRate}%</div>
            <p className="text-xs text-muted-foreground">{t('overallFailureRate')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

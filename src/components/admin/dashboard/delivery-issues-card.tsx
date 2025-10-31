'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { OpenDeliveryIssues } from '@/app/actions/admin-dashboard';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DeliveryIssuesCardProps {
  data: OpenDeliveryIssues;
  loading: boolean;
}

export function DeliveryIssuesCard({ data, loading }: DeliveryIssuesCardProps) {
  const t = useTranslations('admin.dashboard.charts.deliveryIssues');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Total Issues - Large Display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-bold">{data.totalIssues}</p>
            <p className="text-lg text-muted-foreground">{t('totalIssues')}</p>
          </div>
        </div>

        {/* Breakdown by Status */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground">{t('breakdownTitle')}</h4>

          <div className="grid grid-cols-5 gap-3">
            {/* Open */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('open')}</p>
              <p className="text-2xl font-bold text-red-600">{data.openCount}</p>
            </div>

            {/* Assigned */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('assigned')}</p>
              <p className="text-2xl font-bold text-orange-600">{data.assignedCount}</p>
            </div>

            {/* In Progress */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('inProgress')}</p>
              <p className="text-2xl font-bold text-yellow-600">{data.inProgressCount}</p>
            </div>

            {/* Resolved */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('resolved')}</p>
              <p className="text-2xl font-bold text-green-600">{data.resolvedCount}</p>
            </div>

            {/* Closed */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('closed')}</p>
              <p className="text-2xl font-bold text-gray-600">{data.closedCount}</p>
            </div>
          </div>
        </div>

        {data.totalIssues === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">{t('noIssues')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

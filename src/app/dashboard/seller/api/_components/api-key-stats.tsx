'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Activity, Calendar, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

interface ApiKeyStatsProps {
  stats: {
    totalKeys: number;
    activeKeys: number;
    totalUsage: number;
    lastUsed: Date | null;
  };
}

export function ApiKeyStats({ stats }: ApiKeyStatsProps) {
  const t = useTranslations('apiManagement');

  const lastUsedText = stats.lastUsed
    ? formatDistanceToNow(new Date(stats.lastUsed), { addSuffix: true })
    : t('stats.never');

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.totalKeys')}</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalKeys}</div>
          <p className="text-xs text-muted-foreground">
            {t('stats.totalKeysDescription')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.activeKeys')}</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeKeys}</div>
          <p className="text-xs text-muted-foreground">
            {t('stats.activeKeysDescription')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.totalUsage')}</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {t('stats.totalUsageDescription')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.lastUsed')}</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-sm">{lastUsedText}</div>
          <p className="text-xs text-muted-foreground">
            {t('stats.lastUsedDescription')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
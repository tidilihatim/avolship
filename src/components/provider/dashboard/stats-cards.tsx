'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, CheckCircle, Clock, TrendingUp, Weight, DollarSign } from 'lucide-react';
import { ProviderDashboardStats } from '@/app/actions/provider-dashboard';

interface StatsCardsProps {
  stats: ProviderDashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('providerDashboard.stats');

  const cards = [
    {
      title: t('totalExpeditions'),
      value: stats.totalExpeditions.toLocaleString(),
      icon: Package,
      description: t('totalExpeditionsDesc')
    },
    {
      title: t('activeExpeditions'),
      value: stats.activeExpeditions.toLocaleString(),
      icon: Clock,
      description: t('activeExpeditionsDesc')
    },
    {
      title: t('completedExpeditions'),
      value: stats.completedExpeditions.toLocaleString(),
      icon: CheckCircle,
      description: t('completedExpeditionsDesc')
    },
    {
      title: t('successRate'),
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      description: t('successRateDesc')
    },
    {
      title: t('totalRevenue'),
      value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: t('totalRevenueDesc')
    },
    {
      title: t('totalWeight'),
      value: `${stats.totalWeight.toLocaleString()}kg`,
      icon: Weight,
      description: t('totalWeightDesc')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
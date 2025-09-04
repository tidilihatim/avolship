'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, CheckCircle, Clock, TrendingUp, Weight, DollarSign } from 'lucide-react';
import { ProviderDashboardStats } from '@/app/actions/provider-dashboard';

interface StatsCardsProps {
  stats: ProviderDashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Expeditions',
      value: stats.totalExpeditions.toLocaleString(),
      icon: Package,
      description: 'All time expeditions'
    },
    {
      title: 'Active Expeditions',
      value: stats.activeExpeditions.toLocaleString(),
      icon: Clock,
      description: 'Currently in progress'
    },
    {
      title: 'Completed Expeditions',
      value: stats.completedExpeditions.toLocaleString(),
      icon: CheckCircle,
      description: 'Successfully delivered'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      description: 'Delivery success rate'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: 'All time earnings'
    },
    {
      title: 'Total Weight',
      value: `${stats.totalWeight.toLocaleString()}kg`,
      icon: Weight,
      description: 'Total weight handled'
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
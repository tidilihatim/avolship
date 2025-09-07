'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  DollarSign, 
  UserCheck, 
  Truck, 
  Calendar 
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminStats } from '@/app/actions/admin-dashboard';

interface StatsCardsProps {
  stats: AdminStats;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('admin.dashboard.statsCards');
  
  const statItems = [
    {
      title: t('totalUsers'),
      value: formatNumber(stats.totalUsers),
      icon: Users,
      description: t('descriptions.allPlatformUsers'),
      trend: stats.pendingUsers > 0 
        ? t('trends.pendingApproval', { count: stats.pendingUsers })
        : t('trends.allUsersActive')
    },
    {
      title: t('totalOrders'),
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      description: t('descriptions.lifetimeOrders'),
      trend: stats.todayOrders > 0 
        ? t('trends.ordersToday', { count: stats.todayOrders })
        : t('trends.noOrdersToday')
    },
    {
      title: t('products'),
      value: formatNumber(stats.totalProducts),
      icon: Package,
      description: t('descriptions.availableProducts'),
      trend: t('trends.inInventory')
    },
    {
      title: t('warehouses'),
      value: formatNumber(stats.totalWarehouses),
      icon: Warehouse,
      description: t('descriptions.activeLocations'),
      trend: t('trends.operational')
    },
    {
      title: t('pendingUsers'),
      value: formatNumber(stats.pendingUsers),
      icon: UserCheck,
      description: t('descriptions.awaitingApproval'),
      trend: stats.pendingUsers > 0 ? t('trends.requiresAction') : t('trends.allApproved')
    },
    {
      title: t('activeDelivery'),
      value: formatNumber(stats.activeDeliveryPersonnel),
      icon: Truck,
      description: t('descriptions.availableDrivers'),
      trend: t('trends.readyForDelivery')
    },
    {
      title: t('todaysOrders'),
      value: formatNumber(stats.todayOrders),
      icon: Calendar,
      description: t('descriptions.ordersPlacedToday'),
      trend: new Date().toLocaleDateString()
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.description}
              </p>
              <div className="mt-2">
                <Badge 
                  variant={
                    item.title === 'Pending Users' && stats.pendingUsers > 0 
                      ? 'destructive' 
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {item.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
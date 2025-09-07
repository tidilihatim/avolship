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
  const statItems = [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      icon: Users,
      description: 'All platform users',
      trend: stats.pendingUsers > 0 ? `${stats.pendingUsers} pending approval` : 'All users active'
    },
    {
      title: 'Total Orders',
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      description: 'Lifetime orders',
      trend: stats.todayOrders > 0 ? `${stats.todayOrders} today` : 'No orders today'
    },
    {
      title: 'Products',
      value: formatNumber(stats.totalProducts),
      icon: Package,
      description: 'Available products',
      trend: 'In inventory'
    },
    {
      title: 'Warehouses',
      value: formatNumber(stats.totalWarehouses),
      icon: Warehouse,
      description: 'Active locations',
      trend: 'Operational'
    },
    {
      title: 'Pending Users',
      value: formatNumber(stats.pendingUsers),
      icon: UserCheck,
      description: 'Awaiting approval',
      trend: stats.pendingUsers > 0 ? 'Requires action' : 'All approved'
    },
    {
      title: 'Active Delivery',
      value: formatNumber(stats.activeDeliveryPersonnel),
      icon: Truck,
      description: 'Available drivers',
      trend: 'Ready for delivery'
    },
    {
      title: "Today's Orders",
      value: formatNumber(stats.todayOrders),
      icon: Calendar,
      description: 'Orders placed today',
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
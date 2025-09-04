'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Truck, 
  DollarSign, 
  Package, 
  Clock,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { DeliveryDashboardStats } from '@/app/actions/delivery-dashboard';

interface StatsCardsProps {
  stats: DeliveryDashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Today's Deliveries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayDeliveries}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalDeliveries} total deliveries
          </p>
        </CardContent>
      </Card>

      {/* Today's Earnings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${stats.todayEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            ${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total earned
          </p>
        </CardContent>
      </Card>

      {/* Pending Pickups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Pickups</CardTitle>
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.pendingPickups}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.inTransitDeliveries} in transit
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.successRate}%
          </div>
          <p className="text-xs text-muted-foreground">
            Successful deliveries
          </p>
        </CardContent>
      </Card>

      {/* Total Distance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDistance.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            kilometers traveled
          </p>
        </CardContent>
      </Card>

      {/* Active Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.inTransitDeliveries}
          </div>
          <p className="text-xs text-muted-foreground">
            currently delivering
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
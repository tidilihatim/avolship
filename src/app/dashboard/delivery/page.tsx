import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Package,
  DollarSign,
  AlertCircle,
  Timer
} from 'lucide-react';
import Link from 'next/link';

import {
  getDeliveryDashboardStats,
  getDeliveryStatusChart,
  getEarningsChart,
  getDeliveryTimeChart,
  getActiveDeliveries,
  getRecentDeliveries
} from '@/app/actions/delivery-dashboard';

import { StatsCards } from '@/components/delivery/dashboard/stats-cards';
import { DeliveryStatusChart } from '@/components/delivery/dashboard/charts/delivery-status-chart';
import { EarningsChart } from '@/components/delivery/dashboard/charts/earnings-chart';
import { DeliveryTimeChart } from '@/components/delivery/dashboard/charts/delivery-time-chart';
import { PerformanceOverviewChart } from '@/components/delivery/dashboard/charts/performance-overview-chart';
import { DeliveryDashboardClient } from '@/components/delivery/dashboard/delivery-dashboard-client';

const DeliveryDashboard = async ({ searchParams }: { searchParams: Promise<{ startDate?: string; endDate?: string }> }) => {
  const { startDate, endDate } = await searchParams;
  // Fetch data for the dashboard
  const [
    statsResult,
    statusChartResult,
    earningsChartResult,
    deliveryTimeResult,
    activeDeliveriesResult,
    recentDeliveriesResult
  ] = await Promise.all([
    getDeliveryDashboardStats(),
    getDeliveryStatusChart(),
    getEarningsChart(startDate, endDate),
    getDeliveryTimeChart(),
    getActiveDeliveries(),
    getRecentDeliveries(8)
  ]);

  const stats = statsResult.success ? statsResult.data : null;
  const statusChart = statusChartResult.success ? statusChartResult.data || [] : [];
  const earningsChart = earningsChartResult.success ? earningsChartResult.data || [] : [];
  const deliveryTimeChart = deliveryTimeResult.success ? deliveryTimeResult.data || [] : [];
  const activeDeliveries = activeDeliveriesResult.success ? activeDeliveriesResult.data || [] : [];
  const recentDeliveries = recentDeliveriesResult.success ? recentDeliveriesResult.data || [] : [];

  // Check for any errors
  const hasErrors = !statsResult.success || !statusChartResult.success || 
                   !earningsChartResult.success || !deliveryTimeResult.success;
  const errorMessage = [statsResult, statusChartResult, earningsChartResult, deliveryTimeResult]
    .find(result => !result.success)?.message;

  return (
    <DeliveryDashboardClient>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Dashboard</h1>
          <p className="text-muted-foreground">
            Track your deliveries, earnings, and performance metrics
          </p>
        </div>
      </div>

      {/* Global Error */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || 'Some dashboard data failed to load'}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} />}

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Top Charts Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          <DeliveryStatusChart data={statusChart} />
          <DeliveryTimeChart data={deliveryTimeChart} />
        </div>

        {/* Performance Overview - Full Width */}
        <PerformanceOverviewChart data={earningsChart} />

        {/* Earnings Chart - Full Width */}
        <EarningsChart data={earningsChart} />
      </div>

      {/* Active Deliveries & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Active Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeDeliveries?.slice(0, 4).map((delivery: any) => (
                <div key={delivery._id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{delivery.customerName}</span>
                      <Badge 
                        variant={
                          delivery.status === 'out_for_delivery' ? 'default' : 
                          delivery.status === 'in_transit' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {delivery.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {delivery.isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          OVERDUE
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Order: {delivery.orderId} • ${delivery.totalPrice}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      📍 {delivery.deliveryAddress}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Fee: ${delivery.deliveryFee} • Commission: ${delivery.commission}
                    </div>
                  </div>
                </div>
              ))}
              
              {activeDeliveries?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No active deliveries</p>
                  <p className="text-xs mt-1">Check back for new assignments</p>
                </div>
              )}
              
              {activeDeliveries && activeDeliveries?.length > 4 && (
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/delivery/orders">
                      View All Active ({activeDeliveries?.length})
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDeliveries?.map((delivery: any, index: number) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    delivery.status === 'delivered' ? 'bg-green-500' : 
                    delivery.status === 'delivery_failed' ? 'bg-red-500' :
                    delivery.status === 'in_transit' ? 'bg-blue-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="break-words font-medium">{delivery.title}</div>
                    <div className="text-xs text-muted-foreground">{delivery.description}</div>
                    {delivery.trackingNumber && (
                      <div className="text-xs text-muted-foreground">
                        Tracking: {delivery.trackingNumber}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(delivery.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {recentDeliveries?.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Timer className="w-8 h-8 mx-auto mb-2" />
                  <p>No recent deliveries</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </DeliveryDashboardClient>
  );
};

export default DeliveryDashboard;
import React from 'react';
import {
  getDeliveryRiders,
  getActiveDeliveries,
  getAverageDeliveryTime,
  getSuccessfulDeliveriesPercentage,
  getReturnsPerZone,
} from '@/app/actions/admin-delivery';
import { AdminDeliveryDashboardClient } from '@/components/admin/delivery/admin-delivery-dashboard-client';
import { ActiveDeliveriesList } from '@/components/admin/delivery/active-deliveries-list';
import { AverageDeliveryTimeChart } from '@/components/admin/delivery/charts/average-delivery-time-chart';
import { SuccessfulDeliveriesChart } from '@/components/admin/delivery/charts/successful-deliveries-chart';
import { ReturnsPerZoneMap } from '@/components/admin/delivery/charts/returns-per-zone-map';

const AdminDeliveryDashboard = async ({
  searchParams,
}: {
  searchParams: Promise<{
    riderId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) => {
  const { riderId, startDate, endDate } = await searchParams;

  // Calculate the appropriate period based on date range
  let period: 'daily' | 'monthly' | 'yearly' = 'daily';
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays > 365) {
      period = 'yearly';
    } else if (diffInDays > 31) {
      period = 'monthly';
    } else {
      period = 'daily';
    }
  } else {
    // Default range is 30 days, so use daily
    period = 'daily';
  }

  // Fetch riders, active deliveries, average delivery time, successful deliveries, and returns per zone
  const [ridersResult, activeDeliveriesResult, avgDeliveryTimeResult, successfulDeliveriesResult, returnsPerZoneResult] = await Promise.all([
    getDeliveryRiders(),
    getActiveDeliveries(riderId),
    getAverageDeliveryTime(
      startDate,
      endDate,
      riderId,
      period
    ),
    getSuccessfulDeliveriesPercentage(
      startDate,
      endDate,
      riderId,
      period
    ),
    getReturnsPerZone(
      startDate,
      endDate,
      riderId
    ),
  ]);

  const riders = ridersResult.success ? ridersResult.data || [] : [];
  const activeCount = activeDeliveriesResult.success ? activeDeliveriesResult.count || 0 : 0;
  const avgDeliveryTimeData = avgDeliveryTimeResult.success
    ? avgDeliveryTimeResult.data || []
    : [];
  const successfulDeliveriesData = successfulDeliveriesResult.success
    ? successfulDeliveriesResult.data || []
    : [];
  const returnsPerZoneData = returnsPerZoneResult.success
    ? returnsPerZoneResult.data || []
    : [];

  return (
    <AdminDeliveryDashboardClient riders={riders}>
      <ActiveDeliveriesList initialCount={activeCount} />

      {/* Average Delivery Time Chart */}
      <AverageDeliveryTimeChart data={avgDeliveryTimeData} />

      {/* Successful Deliveries Chart */}
      <SuccessfulDeliveriesChart data={successfulDeliveriesData} />

      {/* Returns Per Zone Map */}
      <ReturnsPerZoneMap data={returnsPerZoneData} />
    </AdminDeliveryDashboardClient>
  );
};

export default AdminDeliveryDashboard;

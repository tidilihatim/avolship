import React from 'react';
import { getWarehouses, getTotalCODCollected, getAverageOrderValue, getPayoutsToSellers } from '@/app/actions/admin-finance';
import { AdminFinanceDashboardClient } from '@/components/admin/finance/admin-finance-dashboard-client';
import { TotalCODCollectedChart } from '@/components/admin/finance/charts/total-cod-collected-chart';
import { AverageOrderValueChart } from '@/components/admin/finance/charts/average-order-value-chart';
import { PayoutsToSellersChart } from '@/components/admin/finance/charts/payouts-to-sellers-chart';
import { redirect } from 'next/navigation';

const AdminFinanceDashboard = async ({
  searchParams,
}: {
  searchParams: Promise<{
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) => {
  const { warehouseId, startDate, endDate } = await searchParams;

  // Fetch warehouses
  const warehousesResult = await getWarehouses();
  const warehouses = warehousesResult.success ? warehousesResult.data || [] : [];

  // If no warehouse selected and we have warehouses, redirect to first warehouse
  if (!warehouseId && warehouses.length > 0) {
    redirect(`/dashboard/admin/finance?warehouseId=${warehouses[0]._id}`);
  }

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

  // Fetch financial data (only if warehouse is selected)
  let codCollectedData: any[] = [];
  let aovData: any[] = [];
  let payoutsData: any[] = [];
  let currency = '';

  if (warehouseId) {
    const [codResult, aovResult, payoutsResult] = await Promise.all([
      getTotalCODCollected(warehouseId, startDate, endDate, period),
      getAverageOrderValue(warehouseId, startDate, endDate, period),
      getPayoutsToSellers(warehouseId, startDate, endDate, period),
    ]);

    if (codResult.success) {
      codCollectedData = codResult.data || [];
      currency = codResult.currency || '';
    }

    if (aovResult.success) {
      aovData = aovResult.data || [];
    }

    if (payoutsResult.success) {
      payoutsData = payoutsResult.data || [];
    }
  }

  return (
    <AdminFinanceDashboardClient warehouses={warehouses} selectedWarehouseId={warehouseId}>
      {warehouseId ? (
        <>
          {/* Total COD Collected Chart */}
          <TotalCODCollectedChart data={codCollectedData} currency={currency} />

          {/* Average Order Value Chart */}
          <AverageOrderValueChart data={aovData} currency={currency} />

          {/* Payouts to Sellers Chart */}
          <PayoutsToSellersChart data={payoutsData} currency={currency} />
        </>
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          Please select a warehouse to view financial data
        </div>
      )}
    </AdminFinanceDashboardClient>
  );
};

export default AdminFinanceDashboard;

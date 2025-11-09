import React from 'react';
import { getWarehousesForSystemAnalytics, getDelayedOrders, getHighReturnSellers } from '@/app/actions/admin-system-analytics';
import { AdminSystemAnalyticsClient } from '@/components/admin/system-analytics/admin-system-analytics-client';
import { DelayedOrdersChart } from '@/components/admin/system-analytics/charts/delayed-orders-chart';
import { HighReturnSellersChart } from '@/components/admin/system-analytics/charts/high-return-sellers-chart';
import { redirect } from 'next/navigation';

const AdminSystemAnalytics = async ({
  searchParams,
}: {
  searchParams: Promise<{
    warehouseId?: string;
    page?: string;
    limit?: string;
    returnPage?: string;
    returnLimit?: string;
  }>;
}) => {
  const { warehouseId, page, limit, returnPage, returnLimit } = await searchParams;

  // Parse pagination parameters for delayed orders
  const currentPage = parseInt(page || '1', 10);
  const currentLimit = parseInt(limit || '10', 10);

  // Parse pagination parameters for high return sellers
  const currentReturnPage = parseInt(returnPage || '1', 10);
  const currentReturnLimit = parseInt(returnLimit || '10', 10);

  // Fetch warehouses
  const warehousesResult = await getWarehousesForSystemAnalytics();
  const warehousesData = warehousesResult.success ? warehousesResult.data || [] : [];

  // Serialize warehouses for client component
  const warehouses = warehousesData.map((w: any) => ({
    _id: w._id.toString(),
    name: w.name,
    currency: w.currency,
    country: w.country,
    city: w.city,
  }));

  // If no warehouse selected and we have warehouses, redirect to first warehouse
  if (!warehouseId && warehouses.length > 0) {
    redirect(`/dashboard/admin/system?warehouseId=${warehouses[0]._id}`);
  }

  // Fetch delayed orders data
  let delayedOrdersData: any[] = [];
  let delayedOrdersCount = 0;
  let totalPages = 0;

  // Fetch high return sellers data
  let highReturnSellersData: any[] = [];
  let highReturnSellersCount = 0;
  let returnTotalPages = 0;

  if (warehouseId) {
    const [delayedOrdersResult, highReturnSellersResult] = await Promise.all([
      getDelayedOrders(warehouseId, currentPage, currentLimit),
      getHighReturnSellers(warehouseId, currentReturnPage, currentReturnLimit),
    ]);

    if (delayedOrdersResult.success) {
      // Serialize delayed orders data for client component
      delayedOrdersData = (delayedOrdersResult.data || []).map((order: any) => ({
        ...order,
        confirmedAt: order.confirmedAt.toISOString(),
      }));
      delayedOrdersCount = delayedOrdersResult.count || 0;
      totalPages = delayedOrdersResult.totalPages || 0;
    }

    if (highReturnSellersResult.success) {
      highReturnSellersData = highReturnSellersResult.data || [];
      highReturnSellersCount = highReturnSellersResult.count || 0;
      returnTotalPages = highReturnSellersResult.totalPages || 0;
    }
  }

  return (
    <AdminSystemAnalyticsClient warehouses={warehouses} selectedWarehouseId={warehouseId}>
      {warehouseId ? (
        <>
          {/* Delayed Orders Chart */}
          <DelayedOrdersChart
            data={delayedOrdersData}
            count={delayedOrdersCount}
            page={currentPage}
            limit={currentLimit}
            totalPages={totalPages}
          />

          {/* High Return Sellers Chart */}
          <HighReturnSellersChart
            data={highReturnSellersData}
            count={highReturnSellersCount}
            page={currentReturnPage}
            limit={currentReturnLimit}
            totalPages={returnTotalPages}
          />
        </>
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          Please select a warehouse to view system analytics
        </div>
      )}
    </AdminSystemAnalyticsClient>
  );
};

export default AdminSystemAnalytics;
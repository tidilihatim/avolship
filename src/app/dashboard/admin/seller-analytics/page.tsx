import React from 'react';
import { getWarehousesForAnalytics, getActiveSellers, getInactiveSellers, getNewSellersThisWeek, getOrdersPerSeller, getSellerConfirmationRate, getSellerDeliveryRate, getSellerReturnRate, getProcessedOrders, getSellerRevenue, getRefundedOrders, getRefundAmount, getRefundRate } from '@/app/actions/admin-seller-analytics';
import { AdminSellerAnalyticsClient } from '@/components/admin/seller-analytics/admin-seller-analytics-client';
import { ActiveSellersChart } from '@/components/admin/seller-analytics/charts/active-sellers-chart';
import { InactiveSellersChart } from '@/components/admin/seller-analytics/charts/inactive-sellers-chart';
import { OrdersPerSellerChart } from '@/components/admin/seller-analytics/charts/orders-per-seller-chart';
import { SellerConfirmationRateChart } from '@/components/admin/seller-analytics/charts/seller-confirmation-rate-chart';
import { SellerDeliveryRateChart } from '@/components/admin/seller-analytics/charts/seller-delivery-rate-chart';
import { SellerReturnRateChart } from '@/components/admin/seller-analytics/charts/seller-return-rate-chart';
import { ProcessedOrdersChart } from '@/components/admin/seller-analytics/charts/processed-orders-chart';
import { SellerRevenueChart } from '@/components/admin/seller-analytics/charts/seller-revenue-chart';
import { RefundedOrdersChart } from '@/components/admin/seller-analytics/charts/refunded-orders-chart';
import { RefundAmountChart } from '@/components/admin/seller-analytics/charts/refund-amount-chart';
import { RefundRateChart } from '@/components/admin/seller-analytics/charts/refund-rate-chart';
import { NewSellersCard } from '@/components/admin/seller-analytics/new-sellers-card';
import { redirect } from 'next/navigation';

const AdminSellerAnalytics = async ({
  searchParams,
}: {
  searchParams: Promise<{
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
    sellerId?: string;
    invoiceStatus?: string;
  }>;
}) => {
  const { warehouseId, startDate, endDate, sellerId, invoiceStatus } = await searchParams;

  // Fetch warehouses
  const warehousesResult = await getWarehousesForAnalytics();
  const warehouses = warehousesResult.success ? warehousesResult.data || [] : [];

  // If no warehouse selected and we have warehouses, redirect to first warehouse
  if (!warehouseId && warehouses.length > 0) {
    redirect(`/dashboard/admin/seller-analytics?warehouseId=${warehouses[0]._id}`);
  }

  // Calculate the appropriate period based on date range
  let period: 'daily' | 'monthly' | 'yearly' = 'monthly';
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays > 730) {
      // More than 2 years - use yearly
      period = 'yearly';
    } else if (diffInDays > 90) {
      // More than 3 months - use monthly
      period = 'monthly';
    } else {
      // 3 months or less - use daily
      period = 'daily';
    }
  } else {
    // Default range is this year, so use monthly
    period = 'monthly';
  }

  // Fetch active and inactive sellers data (only if warehouse is selected)
  let activeSellersData: any[] = [];
  let activeSellers: any[] = [];
  let inactiveSellersData: any[] = [];
  let inactiveSellers: any[] = [];
  let newSellersCount = 0;
  let newSellers: any[] = [];
  let ordersData: any[] = [];
  let ordersSellers: any[] = [];
  let totalOrders = 0;
  let confirmationRateData: any[] = [];
  let confirmationSellers: any[] = [];
  let overallRate = 0;
  let confirmedOrders = 0;
  let deliveryRateData: any[] = [];
  let deliverySellers: any[] = [];
  let deliveryOverallRate = 0;
  let deliveredOrders = 0;
  let returnRateData: any[] = [];
  let returnSellers: any[] = [];
  let returnOverallRate = 0;
  let returnedOrders = 0;
  let processedOrdersData: any[] = [];
  let processedSellers: any[] = [];
  let totalProcessed = 0;
  let revenueData: any[] = [];
  let revenueSellers: any[] = [];
  let totalRevenue = 0;
  let currency = 'USD';
  let refundedOrdersData: any[] = [];
  let refundedSellers: any[] = [];
  let totalRefunded = 0;
  let refundAmountData: any[] = [];
  let refundAmountSellers: any[] = [];
  let totalRefundAmount = 0;
  let refundCurrency = 'USD';
  let refundRateData: any[] = [];
  let refundRateSellers: any[] = [];
  let refundOverallRate = 0;
  let refundTotalOrders = 0;
  let refundedOrdersCount = 0;

  if (warehouseId) {
    const [activeSellersResult, inactiveSellersResult, newSellersResult, ordersResult, confirmationResult, deliveryResult, returnResult, processedResult, revenueResult, refundedResult, refundAmountResult, refundRateResult] = await Promise.all([
      getActiveSellers(warehouseId, startDate, endDate, period),
      getInactiveSellers(warehouseId, startDate, endDate, period),
      getNewSellersThisWeek(warehouseId),
      getOrdersPerSeller(warehouseId, startDate, endDate, period, sellerId),
      getSellerConfirmationRate(warehouseId, startDate, endDate, period, sellerId),
      getSellerDeliveryRate(warehouseId, startDate, endDate, period, sellerId),
      getSellerReturnRate(warehouseId, startDate, endDate, period, sellerId),
      getProcessedOrders(warehouseId, startDate, endDate, period, sellerId, invoiceStatus),
      getSellerRevenue(warehouseId, startDate, endDate, period, sellerId, invoiceStatus),
      getRefundedOrders(warehouseId, startDate, endDate, period, sellerId),
      getRefundAmount(warehouseId, startDate, endDate, period, sellerId),
      getRefundRate(warehouseId, startDate, endDate, period, sellerId),
    ]);

    if (activeSellersResult.success) {
      activeSellersData = activeSellersResult.data || [];
      activeSellers = activeSellersResult.sellers || [];
    }

    if (inactiveSellersResult.success) {
      inactiveSellersData = inactiveSellersResult.data || [];
      inactiveSellers = inactiveSellersResult.sellers || [];
    }

    if (newSellersResult.success) {
      newSellersCount = newSellersResult.count || 0;
      newSellers = newSellersResult.sellers || [];
    }

    if (ordersResult.success) {
      ordersData = ordersResult.data || [];
      ordersSellers = ordersResult.sellers || [];
      totalOrders = ordersResult.totalOrders || 0;
    }

    if (confirmationResult.success) {
      confirmationRateData = confirmationResult.data || [];
      confirmationSellers = confirmationResult.sellers || [];
      overallRate = confirmationResult.overallRate || 0;
      confirmedOrders = confirmationResult.confirmedOrders || 0;
    }

    if (deliveryResult.success) {
      deliveryRateData = deliveryResult.data || [];
      deliverySellers = deliveryResult.sellers || [];
      deliveryOverallRate = deliveryResult.overallRate || 0;
      deliveredOrders = deliveryResult.deliveredOrders || 0;
    }

    if (returnResult.success) {
      returnRateData = returnResult.data || [];
      returnSellers = returnResult.sellers || [];
      returnOverallRate = returnResult.overallRate || 0;
      returnedOrders = returnResult.returnedOrders || 0;
    }

    if (processedResult.success) {
      processedOrdersData = processedResult.data || [];
      processedSellers = processedResult.sellers || [];
      totalProcessed = processedResult.totalProcessed || 0;
    }

    if (revenueResult.success) {
      revenueData = revenueResult.data || [];
      revenueSellers = revenueResult.sellers || [];
      totalRevenue = revenueResult.totalRevenue || 0;
      currency = revenueResult.currency || 'USD';
    }

    if (refundedResult.success) {
      refundedOrdersData = refundedResult.data || [];
      refundedSellers = refundedResult.sellers || [];
      totalRefunded = refundedResult.totalRefunded || 0;
    }

    if (refundAmountResult.success) {
      refundAmountData = refundAmountResult.data || [];
      refundAmountSellers = refundAmountResult.sellers || [];
      totalRefundAmount = refundAmountResult.totalRefundAmount || 0;
      refundCurrency = refundAmountResult.currency || 'USD';
    }

    if (refundRateResult.success) {
      refundRateData = refundRateResult.data || [];
      refundRateSellers = refundRateResult.sellers || [];
      refundOverallRate = refundRateResult.overallRate || 0;
      refundTotalOrders = refundRateResult.totalOrders || 0;
      refundedOrdersCount = refundRateResult.refundedOrders || 0;
    }
  }

  return (
    <AdminSellerAnalyticsClient warehouses={warehouses} selectedWarehouseId={warehouseId}>
      {warehouseId ? (
        <>
          {/* New Sellers This Week Card */}
          <NewSellersCard count={newSellersCount} sellers={newSellers} />

          {/* Active Sellers Chart */}
          <ActiveSellersChart data={activeSellersData} sellers={activeSellers} />

          {/* Inactive Sellers Chart */}
          <InactiveSellersChart data={inactiveSellersData} sellers={inactiveSellers} />

          {/* Orders per Seller Chart */}
          <OrdersPerSellerChart
            data={ordersData}
            sellers={ordersSellers}
            totalOrders={totalOrders}
            selectedSellerId={sellerId}
          />

          {/* Seller Confirmation Rate Chart */}
          <SellerConfirmationRateChart
            data={confirmationRateData}
            sellers={confirmationSellers}
            overallRate={overallRate}
            totalOrders={totalOrders}
            confirmedOrders={confirmedOrders}
            selectedSellerId={sellerId}
          />

          {/* Seller Delivery Rate Chart */}
          <SellerDeliveryRateChart
            data={deliveryRateData}
            sellers={deliverySellers}
            overallRate={deliveryOverallRate}
            totalOrders={totalOrders}
            deliveredOrders={deliveredOrders}
            selectedSellerId={sellerId}
          />

          {/* Seller Return Rate Chart */}
          <SellerReturnRateChart
            data={returnRateData}
            sellers={returnSellers}
            overallRate={returnOverallRate}
            totalOrders={totalOrders}
            returnedOrders={returnedOrders}
            selectedSellerId={sellerId}
          />

          {/* Processed Orders Chart */}
          <ProcessedOrdersChart
            data={processedOrdersData}
            sellers={processedSellers}
            totalProcessed={totalProcessed}
            selectedSellerId={sellerId}
            selectedInvoiceStatus={invoiceStatus}
          />

          {/* Seller Revenue Chart */}
          <SellerRevenueChart
            data={revenueData}
            sellers={revenueSellers}
            totalRevenue={totalRevenue}
            currency={currency}
            selectedSellerId={sellerId}
            selectedInvoiceStatus={invoiceStatus}
          />

          {/* Refunded Orders Chart */}
          <RefundedOrdersChart
            data={refundedOrdersData}
            sellers={refundedSellers}
            totalRefunded={totalRefunded}
            selectedSellerId={sellerId}
          />

          {/* Refund Amount Chart */}
          <RefundAmountChart
            data={refundAmountData}
            sellers={refundAmountSellers}
            totalRefundAmount={totalRefundAmount}
            currency={refundCurrency}
            selectedSellerId={sellerId}
          />

          {/* Refund Rate Chart */}
          <RefundRateChart
            data={refundRateData}
            sellers={refundRateSellers}
            overallRate={refundOverallRate}
            totalOrders={refundTotalOrders}
            refundedOrders={refundedOrdersCount}
            selectedSellerId={sellerId}
          />
        </>
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          Please select a warehouse to view seller analytics
        </div>
      )}
    </AdminSellerAnalyticsClient>
  );
};

export default AdminSellerAnalytics;

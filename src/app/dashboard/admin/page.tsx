'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';

import { StatsCards } from '@/components/admin/dashboard/stats-cards';
import { ProcessedAmountCards } from '@/components/admin/dashboard/processed-amount-cards';
import { DeliveryIssuesCard } from '@/components/admin/dashboard/delivery-issues-card';
import { UsersByRoleChart } from '@/components/admin/dashboard/charts/users-by-role-chart';
import { OrderStatusChartComponent } from '@/components/admin/dashboard/charts/order-status-chart';
import { RevenueChartComponent } from '@/components/admin/dashboard/charts/revenue-chart';
import { TotalOrdersChartComponent } from '@/components/admin/dashboard/charts/total-orders-chart';
import { ConfirmedOrdersChartComponent } from '@/components/admin/dashboard/charts/confirmed-orders-chart';
import { ConfirmationRateChartComponent } from '@/components/admin/dashboard/charts/confirmation-rate-chart';
import { DeliveredOrdersChartComponent } from '@/components/admin/dashboard/charts/delivered-orders-chart';
import { DeliveryRateChartComponent } from '@/components/admin/dashboard/charts/delivery-rate-chart';
import { ReturnRateChartComponent } from '@/components/admin/dashboard/charts/return-rate-chart';
import { TotalCashChartComponent } from '@/components/admin/dashboard/charts/total-cash-chart';
import { PendingPayoutsChartComponent } from '@/components/admin/dashboard/charts/pending-payouts-chart';
import { ProcessedOrdersChartComponent } from '@/components/admin/dashboard/charts/processed-orders-chart';
import { RefundedOrdersChartComponent } from '@/components/admin/dashboard/charts/refunded-orders-chart';
import { RefundRateChartComponent } from '@/components/admin/dashboard/charts/refund-rate-chart';
import { NormalSellersChart } from '@/components/admin/dashboard/charts/normal-sellers-chart';
import { BestSellersChart } from '@/components/admin/dashboard/charts/best-sellers-chart';
import { EpicSellersChart } from '@/components/admin/dashboard/charts/epic-sellers-chart';
import { TopPerformersComponent } from '@/components/admin/dashboard/top-performers';
import { RecentActivityComponent } from '@/components/admin/dashboard/recent-activity';
import { DashboardFilters, type DashboardFilters as FilterType } from '@/components/admin/dashboard/filters/dashboard-filters';
import { NetProfitSection } from '@/components/dashboard/net-profit-section';

import {
  StatsCardsSkeleton,
  ChartSkeleton,
  TopPerformersSkeleton,
  RecentActivitySkeleton,
  FiltersSkeleton
} from '@/components/admin/dashboard/skeletons/dashboard-skeleton';

import {
  getAdminDashboardStats,
  getUsersByRole,
  getOrderStatusChart,
  getRevenueChart,
  getTotalOrdersChart,
  getConfirmedOrdersChart,
  getConfirmationRateChart,
  getDeliveredOrdersChart,
  getDeliveryRateChart,
  getReturnRateChart,
  getTotalCashChart,
  getPendingPayouts,
  getProcessedAmount,
  getProcessedOrdersChart,
  getRefundedOrdersChart,
  getRefundRateChart,
  getOpenDeliveryIssues,
  getActiveSellers,
  getNormalSellersChart,
  getBestSellersChart,
  getEpicSellersChart,
  getTopPerformers,
  getRecentActivity,
  type AdminStats,
  type UsersByRole,
  type OrderStatusChart,
  type RevenueChart,
  type TotalOrdersChart,
  type ConfirmedOrdersChart,
  type ConfirmationRateChart,
  type DeliveredOrdersChart,
  type DeliveryRateChart,
  type ReturnRateChart,
  type TotalCashChart,
  type PendingPayoutsData,
  type ProcessedAmountData,
  type ProcessedOrdersChart,
  type RefundedOrdersChart,
  type RefundRateChart,
  type OpenDeliveryIssues,
  type NormalSeller,
  type NormalSellersPeriod,
  type BestSeller,
  type BestSellersPeriod,
  type EpicSeller,
  type EpicSellersPeriod,
  type TopPerformers,
  type AdminFilters
} from '@/app/actions/admin-dashboard';
import { getActiveWarehouses } from '@/app/actions/warehouse';

interface DashboardData {
  stats: AdminStats | null;
  usersByRole: UsersByRole[];
  orderStatusChart: OrderStatusChart[];
  revenueChart: RevenueChart[];
  totalOrders: TotalOrdersChart[];
  confirmedOrders: ConfirmedOrdersChart[];
  confirmationRate: ConfirmationRateChart[];
  deliveredOrders: DeliveredOrdersChart[];
  deliveryRate: DeliveryRateChart[];
  returnRate: ReturnRateChart[];
  totalCash: TotalCashChart[];
  totalCashCurrency?: string;
  pendingPayouts: PendingPayoutsData;
  processedAmount: ProcessedAmountData;
  processedOrders: ProcessedOrdersChart[];
  refundedOrders: RefundedOrdersChart[];
  refundRate: RefundRateChart[];
  deliveryIssues: OpenDeliveryIssues;
  normalSellers: NormalSeller[];
  bestSellers: BestSeller[];
  epicSellers: EpicSeller[];
  topPerformers: TopPerformers[];
  recentActivity: any[];
}

export default function AdminOverviewPage() {
  const t = useTranslations('admin.dashboard');
  const [data, setData] = useState<DashboardData>({
    stats: null,
    usersByRole: [],
    orderStatusChart: [],
    revenueChart: [],
    totalOrders: [],
    confirmedOrders: [],
    confirmationRate: [],
    deliveredOrders: [],
    deliveryRate: [],
    returnRate: [],
    totalCash: [],
    totalCashCurrency: undefined,
    pendingPayouts: {
      totalOrders: 0,
      totalAmount: 0,
      currency: undefined
    },
    processedAmount: {
      totalOrders: 0,
      totalAmount: 0,
      currency: undefined
    },
    processedOrders: [],
    refundedOrders: [],
    refundRate: [],
    deliveryIssues: {
      totalIssues: 0,
      openCount: 0,
      assignedCount: 0,
      inProgressCount: 0,
      resolvedCount: 0,
      closedCount: 0
    },
    normalSellers: [],
    bestSellers: [],
    epicSellers: [],
    topPerformers: [],
    recentActivity: []
  });

  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    charts: true,
    totalOrders: true,
    confirmedOrders: true,
    confirmationRate: true,
    deliveredOrders: true,
    deliveryRate: true,
    returnRate: true,
    totalCash: true,
    pendingPayouts: true,
    processedAmount: true,
    processedOrders: true,
    refundedOrders: true,
    refundRate: true,
    deliveryIssues: true,
    normalSellers: true,
    bestSellers: true,
    epicSellers: true,
    performers: true,
    activity: true
  });
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterType>({
    dateRange: { preset: 'this_month' }
  });
  const [warehouses, setWarehouses] = useState<Array<{ _id: string; name: string; }>>([]);
  const [sellers, setSellers] = useState<Array<{ _id: string; name: string; businessName?: string }>>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | undefined>(undefined);
  const [selectedProcessedSellerId, setSelectedProcessedSellerId] = useState<string | undefined>(undefined);
  const [selectedRefundRateSellerId, setSelectedRefundRateSellerId] = useState<string | undefined>(undefined);

  // Map global filter preset to normal sellers period
  const getNormalSellersPeriod = (preset?: string): NormalSellersPeriod => {
    switch (preset) {
      case 'today':
      case 'yesterday':
      case 'this_week':
        return 'weekly';
      case 'this_year':
        return 'yearly';
      case 'this_month':
      default:
        return 'monthly';
    }
  };

  const fetchDashboardData = useCallback(async (currentFilters: FilterType) => {
    try {
      setLoading(true);
      setLoadingStates({
        stats: true,
        charts: true,
        totalOrders: true,
        confirmedOrders: true,
        confirmationRate: true,
        deliveredOrders: true,
        deliveryRate: true,
        returnRate: true,
        totalCash: true,
        pendingPayouts: true,
        processedAmount: true,
        processedOrders: true,
        refundedOrders: true,
        refundRate: true,
        deliveryIssues: true,
        normalSellers: true,
        bestSellers: true,
        epicSellers: true,
        performers: true,
        activity: true
      });
      setError(null);

      // Fetch warehouses for filter dropdown (only once)
      if (warehouses.length === 0) {
        const warehousesResponse = await getActiveWarehouses();
        if (warehousesResponse.warehouses) {
          setWarehouses(warehousesResponse.warehouses.map((w: any) => ({
            _id: w._id.toString(),
            name: w.name
          })));
        }
      }

      // Fetch sellers for pending payouts filter dropdown (only once)
      if (sellers.length === 0) {
        const sellersResponse = await getActiveSellers();
        if (sellersResponse.sellers) {
          setSellers(sellersResponse.sellers);
        }
      }

      // Prepare filters for all server actions
      const adminFilters: AdminFilters = {
        dateRange: {
          preset: currentFilters.dateRange.preset,
          from: currentFilters.dateRange.from,
          to: currentFilters.dateRange.to
        },
        userRole: currentFilters.userRole,
        orderStatus: currentFilters.orderStatus,
        warehouseId: currentFilters.warehouseId
      };

      // Fetch stats first
      const statsResponse = await getAdminDashboardStats(adminFilters);
      if (statsResponse.success) {
        setData(prev => ({ ...prev, stats: statsResponse.data || null }));
        setLoadingStates(prev => ({ ...prev, stats: false }));
      }

      // Fetch charts data
      const [
        usersByRoleResponse,
        orderStatusResponse,
        revenueResponse
      ] = await Promise.all([
        getUsersByRole(adminFilters),
        getOrderStatusChart(adminFilters),
        getRevenueChart(adminFilters)
      ]);

      if (usersByRoleResponse.success && orderStatusResponse.success && revenueResponse.success) {
        setData(prev => ({
          ...prev,
          usersByRole: usersByRoleResponse.data || [],
          orderStatusChart: orderStatusResponse.data || [],
          revenueChart: revenueResponse.data || []
        }));
        setLoadingStates(prev => ({ ...prev, charts: false }));
      }

      // Fetch total orders chart data
      const totalOrdersResponse = await getTotalOrdersChart(adminFilters);
      if (totalOrdersResponse.success) {
        setData(prev => ({ ...prev, totalOrders: totalOrdersResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, totalOrders: false }));
      }

      // Fetch confirmed orders chart data
      const confirmedOrdersResponse = await getConfirmedOrdersChart(adminFilters);
      if (confirmedOrdersResponse.success) {
        setData(prev => ({ ...prev, confirmedOrders: confirmedOrdersResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, confirmedOrders: false }));
      }

      // Fetch confirmation rate chart data
      const confirmationRateResponse = await getConfirmationRateChart(adminFilters);
      if (confirmationRateResponse.success) {
        setData(prev => ({ ...prev, confirmationRate: confirmationRateResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, confirmationRate: false }));
      }

      // Fetch delivered orders chart data
      const deliveredOrdersResponse = await getDeliveredOrdersChart(adminFilters);
      if (deliveredOrdersResponse.success) {
        setData(prev => ({ ...prev, deliveredOrders: deliveredOrdersResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, deliveredOrders: false }));
      }

      // Fetch delivery rate chart data
      const deliveryRateResponse = await getDeliveryRateChart(adminFilters);
      if (deliveryRateResponse.success) {
        setData(prev => ({ ...prev, deliveryRate: deliveryRateResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, deliveryRate: false }));
      }

      // Fetch return rate chart data
      const returnRateResponse = await getReturnRateChart(adminFilters);
      if (returnRateResponse.success) {
        setData(prev => ({ ...prev, returnRate: returnRateResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, returnRate: false }));
      }

      // Fetch total cash chart data
      const totalCashResponse = await getTotalCashChart(adminFilters);
      if (totalCashResponse.success) {
        setData(prev => ({
          ...prev,
          totalCash: totalCashResponse.data || [],
          totalCashCurrency: totalCashResponse.currency
        }));
        setLoadingStates(prev => ({ ...prev, totalCash: false }));
      }

      // Fetch pending payouts data
      const pendingPayoutsResponse = await getPendingPayouts(adminFilters, selectedSellerId);
      if (pendingPayoutsResponse.success && pendingPayoutsResponse.data) {
        setData(prev => ({
          ...prev,
          pendingPayouts: pendingPayoutsResponse.data!
        }));
        setLoadingStates(prev => ({ ...prev, pendingPayouts: false }));
      }

      // Fetch processed amount data
      const processedAmountResponse = await getProcessedAmount(adminFilters, selectedProcessedSellerId);
      if (processedAmountResponse.success && processedAmountResponse.data) {
        setData(prev => ({
          ...prev,
          processedAmount: processedAmountResponse.data!
        }));
        setLoadingStates(prev => ({ ...prev, processedAmount: false }));
      }

      // Fetch processed orders chart data
      const processedOrdersResponse = await getProcessedOrdersChart(adminFilters);
      if (processedOrdersResponse.success) {
        setData(prev => ({ ...prev, processedOrders: processedOrdersResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, processedOrders: false }));
      }

      // Fetch refunded orders chart data
      const refundedOrdersResponse = await getRefundedOrdersChart(adminFilters);
      if (refundedOrdersResponse.success) {
        setData(prev => ({ ...prev, refundedOrders: refundedOrdersResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, refundedOrders: false }));
      }

      // Fetch refund rate chart data
      const refundRateResponse = await getRefundRateChart(adminFilters, selectedRefundRateSellerId);
      if (refundRateResponse.success) {
        setData(prev => ({ ...prev, refundRate: refundRateResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, refundRate: false }));
      }

      // Fetch open delivery issues data
      const deliveryIssuesResponse = await getOpenDeliveryIssues(adminFilters);
      if (deliveryIssuesResponse.success && deliveryIssuesResponse.data) {
        setData(prev => ({ ...prev, deliveryIssues: deliveryIssuesResponse.data! }));
        setLoadingStates(prev => ({ ...prev, deliveryIssues: false }));
      }

      // Fetch normal sellers data with period derived from global filters
      const sellersPeriod = getNormalSellersPeriod(currentFilters.dateRange.preset);
      const normalSellersResponse = await getNormalSellersChart(sellersPeriod, adminFilters);
      if (normalSellersResponse.success) {
        setData(prev => ({ ...prev, normalSellers: normalSellersResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, normalSellers: false }));
      }

      // Fetch best sellers data with period derived from global filters
      const bestSellersResponse = await getBestSellersChart(sellersPeriod, adminFilters);
      if (bestSellersResponse.success) {
        setData(prev => ({ ...prev, bestSellers: bestSellersResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, bestSellers: false }));
      }

      // Fetch epic sellers data with period derived from global filters
      const epicSellersResponse = await getEpicSellersChart(sellersPeriod, adminFilters);
      if (epicSellersResponse.success) {
        setData(prev => ({ ...prev, epicSellers: epicSellersResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, epicSellers: false }));
      }

      // Fetch performers and activity
      const [performersResponse, activityResponse] = await Promise.all([
        getTopPerformers(),
        getRecentActivity(15)
      ]);

      if (performersResponse.success) {
        setData(prev => ({ ...prev, topPerformers: performersResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, performers: false }));
      }

      if (activityResponse.success) {
        setData(prev => ({ ...prev, recentActivity: activityResponse.data || [] }));
        setLoadingStates(prev => ({ ...prev, activity: false }));
      }

      // Check for any failures
      const responses = [statsResponse, usersByRoleResponse, orderStatusResponse, revenueResponse, totalOrdersResponse, confirmedOrdersResponse, confirmationRateResponse, deliveredOrdersResponse, deliveryRateResponse, returnRateResponse, totalCashResponse, pendingPayoutsResponse, processedAmountResponse, processedOrdersResponse, normalSellersResponse, bestSellersResponse, epicSellersResponse, performersResponse, activityResponse];
      const failedResponse = responses.find(response => !response.success);

      if (failedResponse) {
        console.error('Dashboard API error:', failedResponse.message);
        setError(failedResponse.message || 'Some dashboard data failed to load');
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setLoadingStates({
        stats: false,
        charts: false,
        totalOrders: false,
        confirmedOrders: false,
        confirmationRate: false,
        deliveredOrders: false,
        deliveryRate: false,
        returnRate: false,
        totalCash: false,
        pendingPayouts: false,
        processedAmount: false,
        processedOrders: false,
        refundedOrders: false,
        refundRate: false,
        deliveryIssues: false,
        normalSellers: false,
        bestSellers: false,
        epicSellers: false,
        performers: false,
        activity: false
      });
    }
  }, [warehouses.length, sellers.length]);

  useEffect(() => {
    fetchDashboardData(filters);
  }, [fetchDashboardData, filters]);

  const handleFiltersChange = useCallback((newFilters: FilterType) => {
    const prevFilters = filters;
    setFilters(newFilters);

    // Determine if we should refetch data
    const shouldRefetch = (() => {
      // If switching TO custom range preset, don't refetch yet
      if (newFilters.dateRange.preset === 'custom' && prevFilters.dateRange.preset !== 'custom') {
        return false;
      }

      // If we're in custom range and both dates are selected, refetch
      if (newFilters.dateRange.preset === 'custom') {
        return newFilters.dateRange.from && newFilters.dateRange.to;
      }

      // For non-custom presets, always refetch
      return true;
    })();

    if (shouldRefetch) {
      fetchDashboardData(newFilters);
    }
  }, [fetchDashboardData, filters]);

  // Handle seller change for Pending Payouts chart
  const handleSellerChange = useCallback(async (newSellerId: string | undefined) => {
    setSelectedSellerId(newSellerId);
    setLoadingStates(prev => ({ ...prev, pendingPayouts: true }));

    // Prepare filters
    const adminFilters: AdminFilters = {
      dateRange: {
        preset: filters.dateRange.preset,
        from: filters.dateRange.from,
        to: filters.dateRange.to
      },
      userRole: filters.userRole,
      orderStatus: filters.orderStatus,
      warehouseId: filters.warehouseId
    };

    // Fetch pending payouts with new seller filter
    const pendingPayoutsResponse = await getPendingPayouts(adminFilters, newSellerId);
    if (pendingPayoutsResponse.success && pendingPayoutsResponse.data) {
      setData(prev => ({
        ...prev,
        pendingPayouts: pendingPayoutsResponse.data!
      }));
    }
    setLoadingStates(prev => ({ ...prev, pendingPayouts: false }));
  }, [filters]);

  // Handle seller change for Processed Amount cards
  const handleProcessedSellerChange = useCallback(async (newSellerId: string | undefined) => {
    setSelectedProcessedSellerId(newSellerId);
    setLoadingStates(prev => ({ ...prev, processedAmount: true }));

    // Prepare filters
    const adminFilters: AdminFilters = {
      dateRange: {
        preset: filters.dateRange.preset,
        from: filters.dateRange.from,
        to: filters.dateRange.to
      },
      userRole: filters.userRole,
      orderStatus: filters.orderStatus,
      warehouseId: filters.warehouseId
    };

    // Fetch processed amount with new seller filter
    const processedAmountResponse = await getProcessedAmount(adminFilters, newSellerId);
    if (processedAmountResponse.success && processedAmountResponse.data) {
      setData(prev => ({
        ...prev,
        processedAmount: processedAmountResponse.data!
      }));
    }
    setLoadingStates(prev => ({ ...prev, processedAmount: false }));
  }, [filters]);

  // Handle seller change for Refund Rate chart
  const handleRefundRateSellerChange = useCallback(async (newSellerId: string | undefined) => {
    setSelectedRefundRateSellerId(newSellerId);
    setLoadingStates(prev => ({ ...prev, refundRate: true }));

    // Prepare filters
    const adminFilters: AdminFilters = {
      dateRange: {
        preset: filters.dateRange.preset,
        from: filters.dateRange.from,
        to: filters.dateRange.to
      },
      userRole: filters.userRole,
      orderStatus: filters.orderStatus,
      warehouseId: filters.warehouseId
    };

    // Fetch refund rate with new seller filter
    const refundRateResponse = await getRefundRateChart(adminFilters, newSellerId);
    if (refundRateResponse.success && refundRateResponse.data) {
      setData(prev => ({
        ...prev,
        refundRate: refundRateResponse.data!
      }));
    }
    setLoadingStates(prev => ({ ...prev, refundRate: false }));
  }, [filters]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Global Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      {loading && loadingStates.stats ? (
        <FiltersSkeleton />
      ) : (
        <DashboardFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          loading={loading}
          warehouses={warehouses}
        />
      )}

      {/* Stats Cards */}
      {loadingStates.stats ? (
        <StatsCardsSkeleton />
      ) : data.stats ? (
        <StatsCards stats={data.stats} />
      ) : null}

      {/* Net Profit Section */}
      <NetProfitSection showSellerFilter={true} />

      {/* Processed Amount + Delivery Issues Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <ProcessedAmountCards
          data={data.processedAmount}
          loading={loadingStates.processedAmount}
          onSellerChange={handleProcessedSellerChange}
          sellers={sellers}
        />
        <DeliveryIssuesCard
          data={data.deliveryIssues}
          loading={loadingStates.deliveryIssues}
        />
      </div>

      {/* Pending Payouts Chart - Full Width */}
      <div className="w-full overflow-hidden">
        <PendingPayoutsChartComponent
          data={data.pendingPayouts}
          loading={loadingStates.pendingPayouts}
          onSellerChange={handleSellerChange}
          sellers={sellers}
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Total Orders + Total Cash Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.totalOrders ? (
              <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
            ) : (
              <TotalOrdersChartComponent data={data.totalOrders} />
            )}
          </div>
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.totalCash ? (
              <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
            ) : (
              <TotalCashChartComponent data={data.totalCash} currency={data.totalCashCurrency} />
            )}
          </div>
        </div>

        {/* Confirmed Orders + Delivered Orders Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.confirmedOrders ? (
              <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
            ) : (
              <ConfirmedOrdersChartComponent data={data.confirmedOrders} />
            )}
          </div>
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.deliveredOrders ? (
              <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
            ) : (
              <DeliveredOrdersChartComponent data={data.deliveredOrders} />
            )}
          </div>
        </div>

        {/* Processed Orders + Refunded Orders Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.processedOrders ? (
              <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
            ) : (
              <ProcessedOrdersChartComponent data={data.processedOrders} />
            )}
          </div>
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.refundedOrders ? (
              <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
            ) : (
              <RefundedOrdersChartComponent data={data.refundedOrders} />
            )}
          </div>
        </div>

        {/* Refund Rate + Return Rate Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          <div className="w-full min-w-0 overflow-hidden">
            <RefundRateChartComponent
              data={data.refundRate}
              loading={loadingStates.refundRate}
              onSellerChange={handleRefundRateSellerChange}
              sellers={sellers}
            />
          </div>
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.returnRate ? (
              <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
            ) : (
              <ReturnRateChartComponent data={data.returnRate} />
            )}
          </div>
        </div>

        {/* Confirmation Rate + Delivery Rate Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.confirmationRate ? (
              <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
            ) : (
              <ConfirmationRateChartComponent data={data.confirmationRate} />
            )}
          </div>
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.deliveryRate ? (
              <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
            ) : (
              <DeliveryRateChartComponent data={data.deliveryRate} />
            )}
          </div>
        </div>

        {/* Users by Role + Order Status Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {loadingStates.charts ? (
            <>
              <div className="w-full overflow-hidden">
                <ChartSkeleton className="h-[250px] sm:h-[300px] lg:h-[350px]" />
              </div>
              <div className="w-full overflow-hidden">
                <ChartSkeleton className="h-[250px] sm:h-[300px] lg:h-[350px]" />
              </div>
            </>
          ) : (
            <>
              <div className="w-full min-w-0 overflow-hidden">
                <UsersByRoleChart data={data.usersByRole} />
              </div>
              <div className="w-full min-w-0 overflow-hidden">
                <OrderStatusChartComponent data={data.orderStatusChart} />
              </div>
            </>
          )}
        </div>

        {/* Sellers Charts Row - 2 Columns */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Normal Sellers Chart */}
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.normalSellers ? (
              <ChartSkeleton className="h-[400px] sm:h-[450px] lg:h-[500px]" />
            ) : (
              <NormalSellersChart
                data={data.normalSellers}
                currentPeriod={getNormalSellersPeriod(filters.dateRange.preset)}
                loading={loadingStates.normalSellers}
              />
            )}
          </div>

          {/* Best Sellers Chart */}
          <div className="w-full min-w-0 overflow-hidden">
            {loadingStates.bestSellers ? (
              <ChartSkeleton className="h-[400px] sm:h-[450px] lg:h-[500px]" />
            ) : (
              <BestSellersChart
                data={data.bestSellers}
                currentPeriod={getNormalSellersPeriod(filters.dateRange.preset)}
                loading={loadingStates.bestSellers}
              />
            )}
          </div>
        </div>

        {/* Epic Sellers Chart - Full Width */}
        <div className="w-full overflow-hidden">
          {loadingStates.epicSellers ? (
            <ChartSkeleton className="h-[400px] sm:h-[450px] lg:h-[500px]" />
          ) : (
            <EpicSellersChart
              data={data.epicSellers}
              currentPeriod={getNormalSellersPeriod(filters.dateRange.preset)}
              loading={loadingStates.epicSellers}
            />
          )}
        </div>

        {/* Bottom Charts Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* {loadingStates.performers ? (
            <TopPerformersSkeleton />
          ) : (
            <TopPerformersComponent data={data.topPerformers} />
          )} */}

          {/* {loadingStates.activity ? (
            <RecentActivitySkeleton />
          ) : (
            <RecentActivityComponent data={data.recentActivity} />
          )} */}
        </div>
      </div>
    </div>
  );
}
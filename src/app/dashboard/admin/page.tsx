'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';

import { StatsCards } from '@/components/admin/dashboard/stats-cards';
import { UsersByRoleChart } from '@/components/admin/dashboard/charts/users-by-role-chart';
import { OrderStatusChartComponent } from '@/components/admin/dashboard/charts/order-status-chart';
import { RevenueChartComponent } from '@/components/admin/dashboard/charts/revenue-chart';
import { TopPerformersComponent } from '@/components/admin/dashboard/top-performers';
import { RecentActivityComponent } from '@/components/admin/dashboard/recent-activity';
import { DashboardFilters, type DashboardFilters as FilterType } from '@/components/admin/dashboard/filters/dashboard-filters';

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
  getTopPerformers,
  getRecentActivity,
  type AdminStats,
  type UsersByRole,
  type OrderStatusChart,
  type RevenueChart,
  type TopPerformers,
  type AdminFilters
} from '@/app/actions/admin-dashboard';

interface DashboardData {
  stats: AdminStats | null;
  usersByRole: UsersByRole[];
  orderStatusChart: OrderStatusChart[];
  revenueChart: RevenueChart[];
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
    topPerformers: [],
    recentActivity: []
  });
  
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    charts: true,
    performers: true,
    activity: true
  });
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterType>({
    dateRange: { preset: 'this_month' }
  });

  const fetchDashboardData = useCallback(async (currentFilters: FilterType) => {
    try {
      setLoading(true);
      setLoadingStates({
        stats: true,
        charts: true,
        performers: true,
        activity: true
      });
      setError(null);

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
      const responses = [statsResponse, usersByRoleResponse, orderStatusResponse, revenueResponse, performersResponse, activityResponse];
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
        performers: false,
        activity: false
      });
    }
  }, []);

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

  return (
    <div className="space-y-6 p-6">
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
        />
      )}

      {/* Stats Cards */}
      {loadingStates.stats ? (
        <StatsCardsSkeleton />
      ) : data.stats ? (
        <StatsCards stats={data.stats} />
      ) : null}

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Top Charts Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {loadingStates.charts ? (
            <>
              <ChartSkeleton className="h-[350px] sm:h-[400px]" />
              <ChartSkeleton className="h-[350px] sm:h-[400px]" />
            </>
          ) : (
            <>
              <UsersByRoleChart data={data.usersByRole} />
              <OrderStatusChartComponent data={data.orderStatusChart} />
            </>
          )}
        </div>

        {/* Revenue Chart - Full Width */}
        <div className="w-full">
          {loadingStates.charts ? (
            <ChartSkeleton className="h-[300px] sm:h-[350px] lg:h-[400px]" />
          ) : (
            <RevenueChartComponent data={data.revenueChart} />
          )}
        </div>

        {/* Bottom Charts Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* {loadingStates.performers ? (
            <TopPerformersSkeleton />
          ) : (
            <TopPerformersComponent data={data.topPerformers} />
          )} */}
          
          {loadingStates.activity ? (
            <RecentActivitySkeleton />
          ) : (
            <RecentActivityComponent data={data.recentActivity} />
          )}
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { getTranslations } from 'next-intl/server';
import {
  getProviderDashboardStats,
  getExpeditionStatusChart,
  getRevenueChart,
  getTransportModeChart
} from '@/app/actions/provider-dashboard';
import { StatsCards } from '@/components/provider/dashboard/stats-cards';
import { ExpeditionStatusChart } from '@/components/provider/dashboard/charts/expedition-status-chart';
import { RevenueChart } from '@/components/provider/dashboard/charts/revenue-chart';
import { TransportModeChart } from '@/components/provider/dashboard/charts/transport-mode-chart';
import { ProviderDashboardClient } from '@/components/provider/dashboard/provider-dashboard-client';

interface ProviderDashboardProps {
  searchParams: Promise<{ 
    filter?: string;
    start?: string;
    end?: string;
  }>;
}

const ProviderDashboard = async ({ searchParams }: ProviderDashboardProps) => {
  const t = await getTranslations('providerDashboard');
  const params = await searchParams;
  const { filter = 'this_month', start, end } = params;

  const [
    statsResult,
    statusChartResult,
    revenueChartResult,
    transportModeResult
  ] = await Promise.all([
    getProviderDashboardStats(start, end),
    getExpeditionStatusChart(),
    getRevenueChart(start, end),
    getTransportModeChart()
  ]);

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('welcomeSubtitle')}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {statsResult.message || t('errorLoading')}
          </p>
        </div>
      </div>
    );
  }

  const stats = statsResult.data;
  const statusData = statusChartResult.success ? statusChartResult.data || [] : [];
  const revenueData = revenueChartResult.success ? revenueChartResult.data || [] : [];
  const transportModeData = transportModeResult.success ? transportModeResult.data || [] : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      <ProviderDashboardClient>
        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <ExpeditionStatusChart data={statusData} />
          <TransportModeChart data={transportModeData} />
        </div>

        <div className="mt-6">
          <RevenueChart data={revenueData} />
        </div>
      </ProviderDashboardClient>
    </div>
  );
}

export default ProviderDashboard
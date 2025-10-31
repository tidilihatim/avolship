'use client';

import React, { useState, useEffect } from 'react';
import { AgentPerformanceRankingChart } from '@/components/shared/charts/agent-performance-ranking-chart';
import { DatePeriod } from '@/components/shared/filters/chart-date-filter';
import { getAdminAgentPerformanceData } from '@/app/actions/call-center-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export interface AdminAgentPerformanceRankingWrapperProps {
  period: DatePeriod;
  startDate?: Date;
  endDate?: Date;
}

export function AdminAgentPerformanceRankingWrapper({ period, startDate, endDate }: AdminAgentPerformanceRankingWrapperProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const filter: any = { period };

      if (period === 'custom' && startDate && endDate) {
        filter.startDate = startDate.toISOString();
        filter.endDate = endDate.toISOString();
      }

      const result = await getAdminAgentPerformanceData(filter);

      if (result.success) {
        setData(result);
      } else {
        toast.error(result.message || 'Failed to fetch performance data');
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <AgentPerformanceRankingChart
      data={data?.data || []}
      totalAgents={data?.totalAgents}
      viewMode="ranking"
    />
  );
}

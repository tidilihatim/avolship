'use client';

import React, { useState, useEffect } from 'react';
import { getAgentPerformanceData } from '@/app/actions/call-center-charts';
import { AgentPerformanceRankingChart } from '@/components/shared/charts/agent-performance-ranking-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export interface AgentPerformanceRankingWrapperProps {
  startDate?: string;
  endDate?: string;
}

export function AgentPerformanceRankingWrapper({ startDate, endDate }: AgentPerformanceRankingWrapperProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const filter: any = {};

      if (startDate && endDate) {
        filter.startDate = startDate;
        filter.endDate = endDate;
      }

      const result = await getAgentPerformanceData(filter);

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
  }, [startDate, endDate]);

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

  if (!data?.data) {
    return null;
  }

  return (
    <AgentPerformanceRankingChart
      data={data.data}
      totalAgents={data.totalAgents}
      viewMode="single"
    />
  );
}

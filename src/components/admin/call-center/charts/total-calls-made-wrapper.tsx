'use client';

import React, { useState, useEffect } from 'react';
import { TotalCallsMadeChart } from '@/components/shared/charts/total-calls-made-chart';
import { DatePeriod } from '@/components/shared/filters/chart-date-filter';
import { getAdminTotalCallsMadeData } from '@/app/actions/call-center-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export interface AdminTotalCallsMadeWrapperProps {
  period: DatePeriod;
  startDate?: Date;
  endDate?: Date;
  selectedUserId?: string;
}

export function AdminTotalCallsMadeWrapper({ period, startDate, endDate, selectedUserId }: AdminTotalCallsMadeWrapperProps) {
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

      if (selectedUserId && selectedUserId !== 'all') {
        filter.callCenterUserId = selectedUserId;
      }

      const result = await getAdminTotalCallsMadeData(filter);

      if (result.success) {
        setData(result);
      } else {
        toast.error(result.message || 'Failed to fetch chart data');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, selectedUserId]);

  // Fetch chart data when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Calls Made</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TotalCallsMadeChart
      data={data?.data || []}
      grouping={data?.grouping}
      totals={data?.totals}
      showOnlyTotal={false}
    />
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { ConfirmationRateChart } from '@/components/shared/charts/confirmation-rate-chart';
import { DatePeriod } from '@/components/shared/filters/chart-date-filter';
import { getAdminConfirmationRateData } from '@/app/actions/call-center-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export interface AdminConfirmationRateWrapperProps {
  period: DatePeriod;
  startDate?: Date;
  endDate?: Date;
  selectedUserId?: string;
}

export function AdminConfirmationRateWrapper({ period, startDate, endDate, selectedUserId }: AdminConfirmationRateWrapperProps) {
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

      const result = await getAdminConfirmationRateData(filter);

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
          <CardTitle>Confirmation Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <ConfirmationRateChart
      data={data?.data || []}
      grouping={data?.grouping}
      totals={data?.totals}
    />
  );
}

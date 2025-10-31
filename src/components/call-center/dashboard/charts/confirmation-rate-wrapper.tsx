'use client';

import React, { useState, useEffect } from 'react';
import { getConfirmationRateData } from '@/app/actions/call-center-charts';
import { ConfirmationRateChart } from '@/components/shared/charts/confirmation-rate-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export interface ConfirmationRateWrapperProps {
  startDate?: string;
  endDate?: string;
}

export function ConfirmationRateWrapper({ startDate, endDate }: ConfirmationRateWrapperProps) {
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

      const result = await getConfirmationRateData(filter);

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
  }, [startDate, endDate]);

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

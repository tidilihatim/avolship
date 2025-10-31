'use client';

import React, { useState, useEffect } from 'react';
import { getAverageCallDurationData } from '@/app/actions/call-center-charts';
import { AverageCallDurationChart } from '@/components/shared/charts/average-call-duration-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export interface AverageCallDurationWrapperProps {
  startDate?: string;
  endDate?: string;
}

export function AverageCallDurationWrapper({ startDate, endDate }: AverageCallDurationWrapperProps) {
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

      const result = await getAverageCallDurationData(filter);

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
          <CardTitle>Average Call Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <AverageCallDurationChart
      data={data?.data || []}
      grouping={data?.grouping}
      totals={data?.totals}
    />
  );
}

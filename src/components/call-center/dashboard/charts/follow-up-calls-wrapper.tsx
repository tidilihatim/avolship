'use client';

import React, { useState, useEffect } from 'react';
import { getFollowUpCallsData } from '@/app/actions/call-center-charts';
import { FollowUpCallsChart } from '@/components/shared/charts/follow-up-calls-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export interface FollowUpCallsWrapperProps {
  startDate?: string;
  endDate?: string;
}

export function FollowUpCallsWrapper({ startDate, endDate }: FollowUpCallsWrapperProps) {
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

      const result = await getFollowUpCallsData(filter);

      if (result.success) {
        setData(result);
      } else {
        toast.error(result.message || 'Failed to fetch follow-up calls data');
      }
    } catch (error) {
      console.error('Error fetching follow-up calls data:', error);
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
          <CardTitle>Follow-up Calls Required</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <FollowUpCallsChart
      data={data?.data || []}
      grouping={data?.grouping}
      totals={data?.totals}
    />
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

export interface AverageCallDurationDataPoint {
  date: string;
  avgDuration: number; // in seconds
  totalCalls: number;
  totalDuration: number; // in seconds
}

export interface AverageCallDurationChartProps {
  data: AverageCallDurationDataPoint[];
  grouping?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  totals?: {
    avgDuration: number;
    totalCalls: number;
    totalDuration: number;
  };
}

const chartConfig = {
  avgDuration: {
    label: 'Average Duration',
    theme: {
      light: 'hsl(var(--chart-3))',
      dark: 'hsl(var(--chart-3))'
    }
  }
} satisfies ChartConfig;

export function AverageCallDurationChart({
  data,
  grouping = 'daily',
  totals
}: AverageCallDurationChartProps) {
  const t = useTranslations('callCenterDashboard.charts.averageCallDuration');

  // Format duration to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date label based on grouping
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);

    switch (grouping) {
      case 'hourly':
        return format(date, 'HH:mm');
      case 'daily':
        return format(date, 'MMM dd');
      case 'weekly':
        return format(date, 'MMM dd');
      case 'monthly':
        return format(date, 'MMM yyyy');
      case 'yearly':
        return format(date, 'yyyy');
      default:
        return format(date, 'MMM dd');
    }
  };

  // Format data with proper labels
  const formattedData = data.map(item => ({
    ...item,
    dateLabel: formatDateLabel(item.date)
  }));

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noDataYet')}</p>
            <p className="text-xs mt-1">{t('dataWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {totals && (
            <>
              {formatDuration(totals.avgDuration)} {t('averageTime')} • {totals.totalCalls} {t('totalCalls')}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] lg:h-[400px] w-full">
          <BarChart
            data={formattedData}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 40
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={grouping === 'hourly' ? 1 : 'preserveStartEnd'}
              angle={grouping === 'hourly' ? -45 : 0}
              textAnchor={grouping === 'hourly' ? 'end' : 'middle'}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(value) => formatDuration(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    formatDuration(value as number),
                    t('avgDurationLabel')
                  ]}
                  labelFormatter={(label) => {
                    if (grouping === 'hourly') {
                      return `${t('time')} ${label}`;
                    }
                    return `${t('date')} ${label}`;
                  }}
                />
              }
            />
            <Bar
              dataKey="avgDuration"
              fill="var(--color-avgDuration)"
              radius={[8, 8, 0, 0]}
              name="avgDuration"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

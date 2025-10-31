'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

export interface FollowUpCallsDataPoint {
  date: string;
  followUpCalls: number;
  totalCalls: number;
  followUpRate: number;
}

export interface FollowUpCallsChartProps {
  data: FollowUpCallsDataPoint[];
  grouping?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  totals?: {
    followUpCalls: number;
    totalCalls: number;
    followUpRate: number;
  };
}

const chartConfig = {
  followUpCalls: {
    label: 'Follow-up Calls',
    theme: {
      light: 'hsl(var(--chart-4))',
      dark: 'hsl(var(--chart-4))'
    }
  },
  followUpRate: {
    label: 'Follow-up Rate',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

export function FollowUpCallsChart({
  data,
  grouping = 'daily',
  totals
}: FollowUpCallsChartProps) {
  const t = useTranslations('callCenterDashboard.charts.followUpCalls');

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
              {totals.followUpRate}% {t('followUpRate')} • {totals.followUpCalls}/{totals.totalCalls} {t('ordersRequiringFollowUp')}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] lg:h-[400px] w-full">
          <ComposedChart
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
              yAxisId="left"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
              label={{ value: t('calls'), angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              label={{ value: t('rate'), angle: 90, position: 'insideRight', style: { fontSize: 11 } }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === 'followUpCalls') {
                      return [value, t('followUpCallsLabel')];
                    }
                    if (name === 'followUpRate') {
                      return [`${value}%`, t('followUpRateLabel')];
                    }
                    return [value, name];
                  }}
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
              yAxisId="left"
              dataKey="followUpCalls"
              fill="var(--color-followUpCalls)"
              radius={[8, 8, 0, 0]}
              name="followUpCalls"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="followUpRate"
              stroke="var(--color-followUpRate)"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="followUpRate"
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

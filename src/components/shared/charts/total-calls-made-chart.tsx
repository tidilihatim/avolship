'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format } from 'date-fns';

export interface TotalCallsMadeDataPoint {
  date: string;
  calls: number;
  answered: number;
  unreached: number;
}

export interface TotalCallsMadeChartProps {
  data: TotalCallsMadeDataPoint[];
  grouping?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  totals?: {
    calls: number;
    answered: number;
    unreached: number;
    answerRate: number;
  };
  showOnlyTotal?: boolean; // If true, only show total calls without breakdown
}

const chartConfig = {
  calls: {
    label: 'Total Calls',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  answered: {
    label: 'Answered',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  },
  unreached: {
    label: 'Unreached',
    theme: {
      light: 'hsl(var(--chart-3))',
      dark: 'hsl(var(--chart-3))'
    }
  }
} satisfies ChartConfig;

export function TotalCallsMadeChart({
  data,
  grouping = 'daily',
  totals,
  showOnlyTotal = false
}: TotalCallsMadeChartProps) {
  const t = useTranslations('callCenterDashboard.charts.totalCallsMade');

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
            <p className="text-sm">{t('noCallsYet')}</p>
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
              {showOnlyTotal ? (
                <>{totals.calls} {t('totalCalls')}</>
              ) : (
                <>{totals.calls} {t('totalCalls')} • {totals.answered} {t('answered')} • {totals.unreached} {t('unreached')} • {totals.answerRate}% {t('answerRate')}</>
              )}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] lg:h-[400px] w-full">
          <AreaChart
            data={formattedData}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 40
            }}
          >
            <defs>
              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-calls)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-calls)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAnswered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-answered)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-answered)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUnreached" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-unreached)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-unreached)" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              width={40}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const labelMap: Record<string, string> = {
                      calls: t('totalCallsLabel'),
                      answered: t('answeredLabel'),
                      unreached: t('unreachedLabel')
                    };
                    return [
                      `${value} ${t('callsUnit')}`,
                      labelMap[name as string] || name
                    ];
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
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const labelMap: Record<string, string> = {
                  calls: t('totalCallsLabel'),
                  answered: t('answeredLabel'),
                  unreached: t('unreachedLabel')
                };
                return labelMap[value] || value;
              }}
            />
            <Area
              type="monotone"
              dataKey="calls"
              stroke="var(--color-calls)"
              strokeWidth={2}
              fill="url(#colorCalls)"
              name="calls"
            />
            {!showOnlyTotal && (
              <>
                <Area
                  type="monotone"
                  dataKey="answered"
                  stroke="var(--color-answered)"
                  strokeWidth={2}
                  fill="url(#colorAnswered)"
                  name="answered"
                />
                <Area
                  type="monotone"
                  dataKey="unreached"
                  stroke="var(--color-unreached)"
                  strokeWidth={2}
                  fill="url(#colorUnreached)"
                  name="unreached"
                />
              </>
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

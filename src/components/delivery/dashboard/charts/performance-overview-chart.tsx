'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface PerformanceData {
  date: string;
  earnings: number;
  deliveries: number;
}

interface PerformanceOverviewChartProps {
  data: PerformanceData[];
}

const chartConfig = {
  earnings: {
    label: 'Daily Earnings',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  deliveries: {
    label: 'Daily Deliveries',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

export function PerformanceOverviewChart({ data }: PerformanceOverviewChartProps) {
  const t = useTranslations('deliveryDashboard.charts.performanceOverview');

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noData2')}</p>
            <p className="text-xs mt-1">{t('dataWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarnings = data.reduce((sum, item) => sum + item.earnings, 0);
  const totalDeliveries = data.reduce((sum, item) => sum + item.deliveries, 0);
  const avgDailyEarnings = data.length > 0 ? totalEarnings / data.length : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('totalEarnings')} • {totalDeliveries.toLocaleString()} {t('deliveries')} (${avgDailyEarnings.toFixed(2)} {t('avgPerDay')})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
          <LineChart 
            data={data}
            margin={{
              top: 20,
              right: 15,
              left: 15,
              bottom: 40
            }}
          >
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 11 }} 
              width={50}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    name === 'earnings' ? `$${Number(value).toFixed(2)}` : `${value}`,
                    name === 'earnings' ? t('earningsLabel') : t('deliveriesLabel')
                  ]}
                  labelFormatter={(label) => `${t('date')} ${label}`}
                />
              }
            />
            <Line 
              type="monotone"
              dataKey="earnings" 
              stroke="var(--color-earnings)"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="earnings"
            />
            <Line 
              type="monotone"
              dataKey="deliveries" 
              stroke="var(--color-deliveries)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="deliveries"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
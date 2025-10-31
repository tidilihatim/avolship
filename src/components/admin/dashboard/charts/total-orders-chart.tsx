'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslations } from 'next-intl';
import { TotalOrdersChart } from '@/app/actions/admin-dashboard';

interface TotalOrdersChartProps {
  data: TotalOrdersChart[];
}

const chartConfig = {
  orders: {
    label: 'Orders',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

const formatDate = (dateString: string) => {
  // Handle different date formats from backend

  // If it's already formatted (contains letters or W for week), return as is
  if (/[A-Za-z]/.test(dateString) || dateString.includes('W')) {
    return dateString;
  }

  // If it's YYYY-MM-DD format, format nicely
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  // If it's MM-DD HH:00 format, return as is
  if (/^\d{2}-\d{2} \d{2}:\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Fallback
  return dateString;
};

export function TotalOrdersChartComponent({ data }: TotalOrdersChartProps) {
  const t = useTranslations('admin.dashboard.charts.totalOrders');

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noOrdersFound')}</p>
            <p className="text-xs mt-1">{t('noDataMessage')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
  const avgOrdersPerPeriod = Math.round(totalOrders / data.length);

  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
    originalDate: item.date // Keep original for tooltip
  }));

  // Determine chart description based on data
  const getChartDescription = () => {
    if (data.length === 0) return t('noDataAvailable');

    const hasMonthly = data.some(item => /^\w{3} \d{4}$/.test(item.date)); // Jan 2024
    const hasWeekly = data.some(item => item.date.includes('W')); // 2024 W5
    const hasHourly = data.some(item => /\d{2}:\d{2}$/.test(item.date)); // 10:00

    let granularity = 'daily';
    if (hasMonthly) granularity = 'monthly';
    else if (hasWeekly) granularity = 'weekly';
    else if (hasHourly) granularity = 'hourly';

    return t('description', {
      count: totalOrders,
      granularity: t(`granularity.${granularity}`)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {getChartDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="w-full overflow-hidden">
          <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] lg:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{
                  top: 20,
                  right: 15,
                  left: 15,
                  bottom: 60
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={45}
                  label={{
                    value: t('yAxisLabel'),
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 10 }
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        `${value} ${t('ordersUnit')}`,
                        t('orders')
                      ]}
                      labelFormatter={(label) => t('tooltipPeriod', { label })}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--color-orders)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-chart-2 rounded-full flex-shrink-0" />
              <div className="text-sm min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm">{t('totalOrders')}</p>
                <p className="font-medium text-xs sm:text-sm">{totalOrders.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <div className="text-sm min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm">{t('averagePerPeriod')}</p>
                <p className="font-medium text-xs sm:text-sm">{avgOrdersPerPeriod.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

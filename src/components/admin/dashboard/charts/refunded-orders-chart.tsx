'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslations } from 'next-intl';
import { RefundedOrdersChart } from '@/app/actions/admin-dashboard';

interface RefundedOrdersChartProps {
  data: RefundedOrdersChart[];
}

const chartConfig = {
  orders: {
    label: 'Refunded Orders',
    theme: {
      light: 'hsl(var(--chart-4))',
      dark: 'hsl(var(--chart-4))'
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

export function RefundedOrdersChartComponent({ data }: RefundedOrdersChartProps) {
  const t = useTranslations('admin.dashboard.charts.refundedOrders');

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
  const averageOrders = totalOrders / data.length;

  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
    originalDate: item.date // Keep original for tooltip
  }));

  // Determine chart description based on data
  const getChartDescription = () => {
    if (data.length === 0) return t('noDataAvailable');
    return t('description', { count: totalOrders });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{getChartDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  label={{
                    value: t('yAxisLabel'),
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12 }
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value, payload) => {
                        if (payload && payload[0]) {
                          const originalDate = (payload[0].payload as any).originalDate;
                          return `${t('tooltipPeriod', { label: originalDate || value })}`;
                        }
                        return value;
                      }}
                      formatter={(value) => [
                        `${value} ${t('ordersUnit')}`,
                        t('orders')
                      ]}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-4))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t('totalRefunded')}</p>
            <p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t('averagePerPeriod')}</p>
            <p className="text-2xl font-bold">{Math.round(averageOrders).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

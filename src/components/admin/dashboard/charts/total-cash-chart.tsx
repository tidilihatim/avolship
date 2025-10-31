'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslations } from 'next-intl';
import { TotalCashChart } from '@/app/actions/admin-dashboard';

interface TotalCashChartProps {
  data: TotalCashChart[];
  currency?: string;
}

const chartConfig = {
  cash: {
    label: 'Cash',
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

export function TotalCashChartComponent({ data, currency }: TotalCashChartProps) {
  const t = useTranslations('admin.dashboard.charts.totalCash');

  // Show message when warehouse selection is required
  if (!currency) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm font-medium">{t('warehouseRequired')}</p>
            <p className="text-xs mt-1">{t('warehouseRequiredMessage')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noCashFound')}</p>
            <p className="text-xs mt-1">{t('noDataMessage')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCash = data.reduce((sum, item) => sum + item.cash, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
  const avgCashPerOrder = totalOrders > 0 ? totalCash / totalOrders : 0;

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
      amount: `${totalCash.toLocaleString()} ${currency}`,
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
                  width={60}
                  label={{
                    value: `${t('yAxisLabel')} (${currency})`,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 10 }
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString()} ${currency}`,
                        t('cash')
                      ]}
                      labelFormatter={(label) => t('tooltipPeriod', { label })}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="cash"
                  stroke="var(--color-cash)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-chart-2 rounded-full flex-shrink-0" />
              <div className="text-sm min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm">{t('totalCash')}</p>
                <p className="font-medium text-xs sm:text-sm">{totalCash.toLocaleString()} {currency}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <div className="text-sm min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm">{t('totalOrders')}</p>
                <p className="font-medium text-xs sm:text-sm">{totalOrders.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted rounded-full flex-shrink-0" />
              <div className="text-sm min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm">{t('avgPerOrder')}</p>
                <p className="font-medium text-xs sm:text-sm">{avgCashPerOrder.toFixed(2)} {currency}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

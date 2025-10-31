'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslations } from 'next-intl';
import { NormalSeller } from '@/app/actions/admin-dashboard';

interface NormalSellersChartProps {
  data: NormalSeller[];
  onPeriodChange?: (period: 'weekly' | 'monthly' | 'yearly') => void;
  currentPeriod?: 'weekly' | 'monthly' | 'yearly';
  loading?: boolean;
}

const chartConfig = {
  dailyAverage: {
    label: 'Daily Average Orders',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  }
} satisfies ChartConfig;

export function NormalSellersChart({
  data,
  onPeriodChange,
  currentPeriod = 'monthly',
  loading = false
}: NormalSellersChartProps) {
  const t = useTranslations('admin.dashboard.charts.normalSellers');

  // Prepare chart data - limit seller name length for display
  const chartData = data.map(seller => ({
    ...seller,
    displayName: seller.sellerName.length > 15
      ? `${seller.sellerName.substring(0, 15)}...`
      : seller.sellerName
  }));

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noData')}</p>
            <p className="text-xs mt-1">{t('noDataMessage')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description', {
            count: data.length,
            period: t(currentPeriod)
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Chart */}
          <div className="flex-1 min-w-0">
            <ChartContainer config={chartConfig} className="h-[400px] sm:h-[450px] lg:h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 15,
                    left: 15,
                    bottom: 100
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="displayName"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    height={90}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    width={40}
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
                          `${value} ${t('ordersPerDay')}`,
                          t('dailyAverage')
                        ]}
                        labelFormatter={(label) => {
                          // Find the full seller name
                          const seller = data.find(s =>
                            s.sellerName.startsWith(label.toString().replace('...', ''))
                          );
                          return seller ? seller.sellerName : label;
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey="dailyAverage"
                    fill="var(--color-dailyAverage)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Legend / Stats List */}
          <div className="lg:w-64 lg:min-w-[16rem]">
            <div className="space-y-2 max-h-[300px] lg:max-h-[350px] overflow-y-auto">
              <div className="text-xs font-semibold text-foreground mb-2 pb-2 border-b">
                {t('sellersList')}
              </div>
              {data.map((seller, index) => (
                <div
                  key={seller.sellerId}
                  className="flex flex-col gap-1 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground truncate flex-1 mr-2">
                      {index + 1}. {seller.sellerName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t('avgPerDay')}:
                    </span>
                    <span className="font-semibold text-primary">
                      {seller.dailyAverage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t('totalDelivered')}:
                    </span>
                    <span className="font-medium text-foreground">
                      {seller.totalDeliveredOrders}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

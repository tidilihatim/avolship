'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface ActiveSellersData {
  period: string;
  count: number;
}

interface Seller {
  sellerId: string;
  sellerName: string;
}

interface ActiveSellersChartProps {
  data: ActiveSellersData[];
  sellers: Seller[];
}

const chartConfig = {
  count: {
    label: 'Active Sellers',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function ActiveSellersChart({ data, sellers }: ActiveSellersChartProps) {
  const t = useTranslations('adminSellerAnalytics.charts.activeSellers');

  const totalSellers = data.reduce((sum, d) => Math.max(sum, d.count), 0);
  const avgSellers = data.length > 0
    ? Math.round(data.reduce((sum, d) => sum + d.count, 0) / data.length)
    : 0;

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
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
                  style: { fontSize: 12 },
                }}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `${value}`}
                    formatter={(value, name) => [
                      <span key="tooltip-value">
                        <span className="font-medium">{value}</span> {t('sellers')}
                      </span>,
                      t('activeSellers'),
                    ]}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">{t('peakSellers')}</div>
            <div className="text-2xl font-bold">{totalSellers}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">{t('avgSellers')}</div>
            <div className="text-2xl font-bold">{avgSellers}</div>
          </div>
        </div>

        {/* Active Sellers List */}
        {sellers && sellers.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="text-sm font-medium mb-3">{t('sellersList')} ({sellers.length})</div>
            <div className="max-h-[200px] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sellers.map((seller) => (
                  <div
                    key={seller.sellerId}
                    className="text-sm p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {seller.sellerName}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

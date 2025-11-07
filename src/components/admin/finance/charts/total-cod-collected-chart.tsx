'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface CODCollectedData {
  period: string;
  amount: number | null;
}

interface TotalCODCollectedChartProps {
  data: CODCollectedData[];
  currency: string;
}

const chartConfig = {
  amount: {
    label: 'Amount',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function TotalCODCollectedChart({ data, currency }: TotalCODCollectedChartProps) {
  const t = useTranslations('adminFinanceDashboard.charts.totalCODCollected');

  const totalCollected = data.reduce((sum, d) => sum + (d.amount || 0), 0);

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
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                  value: `${t('yAxisLabel')} (${currency})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `${value}`}
                    formatter={(value, name) => [
                      <span key="tooltip-value">
                        <span className="font-medium">{value}</span> {currency}
                      </span>,
                      t('amount'),
                    ]}
                  />
                }
              />
              <Bar
                dataKey="amount"
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {t('totalCollected')}
          </div>
          <div className="text-2xl font-bold">
            {totalCollected.toLocaleString()} {currency}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

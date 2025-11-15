'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface CashInTransitData {
  period: string;
  amount: number | null;
}

interface CashInTransitChartProps {
  data: CashInTransitData[];
  currency: string;
}

const chartConfig = {
  amount: {
    label: 'Amount',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function CashInTransitChart({ data, currency }: CashInTransitChartProps) {
  const t = useTranslations('adminFinanceDashboard.charts.cashInTransit');

  const totalCashInTransit = data.reduce((sum, d) => sum + (d.amount || 0), 0);

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
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#colorAmount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {t('totalCashInTransit')}
          </div>
          <div className="text-2xl font-bold">
            {totalCashInTransit.toLocaleString()} {currency}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

interface AOVData {
  period: string;
  avgValue: number | null;
  orderCount: number;
}

interface AverageOrderValueChartProps {
  data: AOVData[];
  currency: string;
}

const chartConfig = {
  avgValue: {
    label: 'AOV',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export function AverageOrderValueChart({ data, currency }: AverageOrderValueChartProps) {
  const t = useTranslations('adminFinanceDashboard.charts.averageOrderValue');

  const totalOrders = data.reduce((sum, d) => sum + d.orderCount, 0);
  const overallAOV = data.reduce((sum, d) => {
    if (d.avgValue && d.orderCount) {
      return sum + (d.avgValue * d.orderCount);
    }
    return sum;
  }, 0) / (totalOrders || 1);

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
                      t('aov'),
                    ]}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="avgValue"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-4))', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {t('overallAOV')}
          </div>
          <div className="text-2xl font-bold">
            {Math.round(overallAOV * 100) / 100} {currency}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {t('totalOrders', { count: totalOrders })}
        </div>
      </CardContent>
    </Card>
  );
}

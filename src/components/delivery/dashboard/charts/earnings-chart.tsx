'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface EarningsData {
  date: string;
  earnings: number;
  deliveries: number;
}

interface EarningsChartProps {
  data: EarningsData[];
}

const chartConfig = {
  earnings: {
    label: 'Earnings',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  deliveries: {
    label: 'Deliveries',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

export function EarningsChart({ data }: EarningsChartProps) {
  const t = useTranslations('deliveryDashboard.charts.earnings');

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noEarnings')}</p>
            <p className="text-xs mt-1">{t('dataWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarnings = data.reduce((sum, item) => sum + item.earnings, 0);
  const totalDeliveries = data.reduce((sum, item) => sum + item.deliveries, 0);
  const avgEarningsPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('totalEarnings')} {totalDeliveries.toLocaleString()} {t('deliveries')} (${avgEarningsPerDelivery.toFixed(2)} {t('avgPerDelivery')})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
          <AreaChart 
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
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="var(--color-earnings)"
              fill="var(--color-earnings)"
              fillOpacity={0.3}
              strokeWidth={2}
              name="earnings"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
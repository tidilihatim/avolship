'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

interface DeliveryTimeData {
  timeSlot: string;
  deliveries: number;
  averageTime: number;
}

interface DeliveryTimeChartProps {
  data: DeliveryTimeData[];
}

const chartConfig = {
  deliveries: {
    label: 'Deliveries',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  averageTime: {
    label: 'Avg Time (min)',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

export function DeliveryTimeChart({ data }: DeliveryTimeChartProps) {
  const t = useTranslations('deliveryDashboard.charts.deliveryTime');

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noCompletedDeliveries')}</p>
            <p className="text-xs mt-1">{t('dataWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDeliveries = data.reduce((sum, item) => sum + item.deliveries, 0);
  const avgTime = totalDeliveries > 0 ?
    Math.round(data.reduce((sum, item) => sum + (item.averageTime * item.deliveries), 0) / totalDeliveries) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {totalDeliveries} {t('deliveriesCompleted')} {totalDeliveries > 0 ? `(${t('avg')} ${avgTime} ${t('minDeliveryTime')})` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
          <BarChart 
            data={data}
            margin={{
              top: 20,
              right: 15,
              left: 15,
              bottom: 40
            }}
          >
            <XAxis 
              dataKey="timeSlot" 
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
                    name === 'averageTime' ? `${value} min` : `${value}`,
                    name === 'deliveries' ? t('deliveriesLabel') : t('avgTimeLabel')
                  ]}
                  labelFormatter={(label) => `${t('timeSlot')} ${label}`}
                />
              }
            />
            <Bar
              dataKey="deliveries"
              fill="var(--color-deliveries)"
              radius={[4, 4, 0, 0]}
              name="deliveries"
            />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium">{item.timeSlot}</div>
              <div className="text-xs text-muted-foreground">
                {item.deliveries} {t('deliveries')} • {item.averageTime}{t('minAvg')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
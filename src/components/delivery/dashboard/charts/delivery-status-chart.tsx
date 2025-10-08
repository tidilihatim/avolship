'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';

interface DeliveryStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface DeliveryStatusChartProps {
  data: DeliveryStatusData[];
}

const getStatusColor = (status: string, index: number): string => {
  const statusColors: Record<string, string> = {
    'assigned_to_delivery': `hsl(var(--chart-1))`,
    'accepted_by_delivery': `hsl(var(--chart-2))`,
    'in_transit': `hsl(var(--chart-3))`,
    'out_for_delivery': `hsl(var(--chart-4))`,
    'delivered': `hsl(var(--chart-5))`,
    'delivery_failed': `hsl(var(--chart-1))`,
    'pending': `hsl(var(--chart-2))`,
    'confirmed': `hsl(var(--chart-3))`
  };
  
  return statusColors[status] || `hsl(var(--chart-${((index % 5) + 1)}))`;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'assigned_to_delivery': 'Assigned',
    'accepted_by_delivery': 'Accepted',
    'in_transit': 'In Transit',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'delivery_failed': 'Failed',
    'pending': 'Pending',
    'confirmed': 'Confirmed'
  };
  return labels[status] || status.replace('_', ' ');
};

const chartConfig = {
  count: {
    label: "Orders",
  },
} satisfies ChartConfig;

export function DeliveryStatusChart({ data }: DeliveryStatusChartProps) {
  const t = useTranslations('deliveryDashboard.charts.deliveryStatus');

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noDeliveries')}</p>
            <p className="text-xs mt-1">{t('dataWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    status: getStatusLabel(item.status),
    count: item.count,
    percentage: item.percentage,
    fill: getStatusColor(item.status, index),
  }));

  const totalDeliveries = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('distribution', { total: totalDeliveries.toLocaleString() })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px] sm:h-[300px] lg:h-[350px] w-full"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="grid grid-cols-1 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: item.fill,
                    border: '1px solid hsl(var(--border))'
                  }}
                />
                <span className="text-muted-foreground">
                  {item.status}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{item.count}</span>
                <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
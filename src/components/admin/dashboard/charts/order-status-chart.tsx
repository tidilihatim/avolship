'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTranslations } from 'next-intl';
import { OrderStatusChart } from '@/app/actions/admin-dashboard';

interface OrderStatusChartProps {
  data: OrderStatusChart[];
}

const chartConfig = {
  count: {
    label: 'Orders',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  }
} satisfies ChartConfig;

export function OrderStatusChartComponent({ data }: OrderStatusChartProps) {
  const t = useTranslations('admin.dashboard.charts.orderStatus');
  const tStatuses = useTranslations('admin.dashboard.statuses');
  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);

  const getStatusLabel = (status: string): string => {
    return tStatuses(status?.toUpperCase() as any) || status.replace('_', ' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description', { count: totalOrders.toLocaleString() })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Chart */}
          <div className="flex-1 min-w-0">
            <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 15,
                    left: 15,
                    bottom: 60
                  }}
                >
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          t('tooltipOrders', { value: Array.isArray(value) ? value[0] : value }),
                          t('count')
                        ]}
                        labelFormatter={(label) => t('tooltipStatus', { label })}
                      />
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Legend */}
          <div className="lg:w-48 lg:min-w-[12rem]">
            <div className="space-y-2 max-h-48 lg:max-h-72 overflow-y-auto">
              {data.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground capitalize text-xs sm:text-sm truncate flex-1 mr-2">
                    {getStatusLabel(item.status)}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="font-medium text-xs sm:text-sm">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
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
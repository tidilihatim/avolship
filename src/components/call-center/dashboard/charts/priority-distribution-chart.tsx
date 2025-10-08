'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

interface PriorityData {
  priority: string;
  count: number;
  percentage: number;
}

interface PriorityDistributionChartProps {
  data: PriorityData[];
  total: number;
}

const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    'Urgent': `hsl(var(--chart-3))`,
    'High': `hsl(var(--chart-2))`,
    'Normal': `hsl(var(--chart-1))`
  };
  
  return colorMap[priority] || `hsl(var(--chart-1))`;
};

const chartConfig = {
  count: {
    label: 'Orders'
  }
} satisfies ChartConfig;

export function PriorityDistributionChart({ data, total }: PriorityDistributionChartProps) {
  const t = useTranslations('callCenterDashboard.charts.priorityDistribution');

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noData')}</p>
            <p className="text-xs mt-1">{t('dataWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    priority: item.priority,
    count: item.count,
    percentage: item.percentage,
    fill: getPriorityColor(item.priority),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {total} {t('pendingOrders')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px]">
          <BarChart 
            data={chartData}
            margin={{
              top: 20,
              right: 15,
              left: 15,
              bottom: 40
            }}
          >
            <XAxis 
              dataKey="priority" 
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              tick={{ fontSize: 11 }} 
              width={40}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    `${value} ${t('ordersUnit')}`,
                    t('count')
                  ]}
                  labelFormatter={(label) => `${t('priority')} ${label}`}
                />
              }
            />
            <Bar 
              dataKey="count" 
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-1 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: item.fill,
                    border: '1px solid hsl(var(--border))'
                  }}
                />
                <span className="text-muted-foreground">
                  {item.priority}
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
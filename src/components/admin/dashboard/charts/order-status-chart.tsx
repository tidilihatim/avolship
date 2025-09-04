'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
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
  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status Distribution</CardTitle>
        <CardDescription>
          Current status of {totalOrders.toLocaleString()} total orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px]">
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
              tick={{ fontSize: 11 }}
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
                    `${value} orders`,
                    'Count'
                  ]}
                  labelFormatter={(label) => `Status: ${label}`}
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
        <div className="grid grid-cols-1 gap-2 mt-4 max-h-32 overflow-y-auto">
          {data.map((item) => (
            <div key={item.status} className="flex items-center justify-between text-sm py-1">
              <span className="text-muted-foreground capitalize">
                {item.status.replace('_', ' ')}
              </span>
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
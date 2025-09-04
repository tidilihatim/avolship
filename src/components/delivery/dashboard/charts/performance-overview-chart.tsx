'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface PerformanceData {
  date: string;
  earnings: number;
  deliveries: number;
}

interface PerformanceOverviewChartProps {
  data: PerformanceData[];
}

const chartConfig = {
  earnings: {
    label: 'Daily Earnings',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  deliveries: {
    label: 'Daily Deliveries',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

export function PerformanceOverviewChart({ data }: PerformanceOverviewChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>No performance data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No performance data available</p>
            <p className="text-xs mt-1">Your daily performance trends will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarnings = data.reduce((sum, item) => sum + item.earnings, 0);
  const totalDeliveries = data.reduce((sum, item) => sum + item.deliveries, 0);
  const avgDailyEarnings = data.length > 0 ? totalEarnings / data.length : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>
          ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total earnings • {totalDeliveries.toLocaleString()} deliveries (${avgDailyEarnings.toFixed(2)} avg/day)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
          <LineChart 
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
                    name === 'earnings' ? 'Earnings' : 'Deliveries'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
              }
            />
            <Line 
              type="monotone"
              dataKey="earnings" 
              stroke="var(--color-earnings)"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="earnings"
            />
            <Line 
              type="monotone"
              dataKey="deliveries" 
              stroke="var(--color-deliveries)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="deliveries"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis } from 'recharts';

interface RevenueData {
  date: string;
  revenue: number;
  expeditions: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  expeditions: {
    label: 'Expeditions',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>No revenue data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No revenue recorded yet</p>
            <p className="text-xs mt-1">Your revenue trends will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpeditions = data.reduce((sum, item) => sum + item.expeditions, 0);
  const avgRevenuePerExpedition = totalExpeditions > 0 ? totalRevenue / totalExpeditions : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
        <CardDescription>
          ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total revenue from {totalExpeditions.toLocaleString()} expeditions (${avgRevenuePerExpedition.toFixed(2)} avg/expedition)
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
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${Number(value).toFixed(2)}` : `${value}`,
                    name === 'revenue' ? 'Revenue' : 'Expeditions'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="var(--color-revenue)"
              fillOpacity={0.3}
              strokeWidth={2}
              name="revenue"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
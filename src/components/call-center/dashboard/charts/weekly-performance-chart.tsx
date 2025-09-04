'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface WeeklyPerformanceData {
  day: string;
  calls: number;
  success: number;
}

interface WeeklyPerformanceChartProps {
  data: WeeklyPerformanceData[];
}

const chartConfig = {
  calls: {
    label: 'Total Calls',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  success: {
    label: 'Successful Calls',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

export function WeeklyPerformanceChart({ data }: WeeklyPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>No weekly performance data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No weekly data available</p>
            <p className="text-xs mt-1">Weekly trends will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCalls = data.reduce((sum, item) => sum + item.calls, 0);
  const totalSuccess = data.reduce((sum, item) => sum + item.success, 0);
  const overallSuccessRate = totalCalls > 0 ? Math.round((totalSuccess / totalCalls) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Performance</CardTitle>
        <CardDescription>
          {totalCalls} calls this week ({overallSuccessRate}% success rate)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px]">
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
              dataKey="day" 
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
                    `${value}`,
                    name === 'calls' ? 'Total Calls' : 'Successful'
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="calls"
              stackId="1"
              stroke="var(--color-calls)"
              fill="var(--color-calls)"
              fillOpacity={0.3}
              name="calls"
            />
            <Area
              type="monotone"
              dataKey="success"
              stackId="2"
              stroke="var(--color-success)"
              fill="var(--color-success)"
              fillOpacity={0.6}
              name="success"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
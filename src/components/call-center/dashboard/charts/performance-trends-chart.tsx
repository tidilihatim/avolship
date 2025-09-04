'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface PerformanceTrendData {
  date: string;
  calls: number;
  answered: number;
  confirmed: number;
  successRate: number;
}

interface PerformanceTrendsChartProps {
  data: PerformanceTrendData[];
}

const chartConfig = {
  calls: {
    label: 'Total Calls',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  answered: {
    label: 'Answered',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  },
  confirmed: {
    label: 'Confirmed',
    theme: {
      light: 'hsl(var(--chart-3))',
      dark: 'hsl(var(--chart-3))'
    }
  }
} satisfies ChartConfig;

export function PerformanceTrendsChart({ data }: PerformanceTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>No performance data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No performance data available</p>
            <p className="text-xs mt-1">Trends will appear as you make calls</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format dates for display
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  const totalCalls = data.reduce((sum, item) => sum + item.calls, 0);
  const totalAnswered = data.reduce((sum, item) => sum + item.answered, 0);
  const avgSuccessRate = data.length > 0 ? 
    Math.round(data.reduce((sum, item) => sum + item.successRate, 0) / data.length) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
        <CardDescription>
          {totalCalls} calls, {totalAnswered} answered ({avgSuccessRate}% avg success rate)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
          <LineChart 
            data={chartData}
            margin={{
              top: 20,
              right: 15,
              left: 15,
              bottom: 40
            }}
          >
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
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
                    name === 'calls' ? 'Total Calls' : 
                    name === 'answered' ? 'Answered' : 'Confirmed'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
              }
            />
            <Line 
              type="monotone"
              dataKey="calls" 
              stroke="var(--color-calls)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="calls"
            />
            <Line 
              type="monotone"
              dataKey="answered" 
              stroke="var(--color-answered)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="answered"
            />
            <Line 
              type="monotone"
              dataKey="confirmed" 
              stroke="var(--color-confirmed)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="confirmed"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
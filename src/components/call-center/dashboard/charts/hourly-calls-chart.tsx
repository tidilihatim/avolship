'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface HourlyCallData {
  hour: string;
  calls: number;
  confirmed: number;
}

interface HourlyCallsChartProps {
  data: HourlyCallData[];
}

const chartConfig = {
  calls: {
    label: 'Total Calls',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  confirmed: {
    label: 'Confirmed',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

export function HourlyCallsChart({ data }: HourlyCallsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hourly Call Activity</CardTitle>
          <CardDescription>No hourly call data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No calls recorded today</p>
            <p className="text-xs mt-1">Hourly activity will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCalls = data.reduce((sum, item) => sum + item.calls, 0);
  const totalConfirmed = data.reduce((sum, item) => sum + item.confirmed, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Hourly Call Activity</CardTitle>
        <CardDescription>
          {totalCalls} total calls, {totalConfirmed} confirmed today
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
              dataKey="hour" 
              tick={{ fontSize: 11 }}
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
                    `${value} calls`,
                    name === 'calls' ? 'Total Calls' : 'Confirmed'
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
              }
            />
            <Bar 
              dataKey="calls" 
              fill="var(--color-calls)"
              radius={[2, 2, 0, 0]}
              name="calls"
            />
            <Bar 
              dataKey="confirmed" 
              fill="var(--color-confirmed)"
              radius={[2, 2, 0, 0]}
              name="confirmed"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
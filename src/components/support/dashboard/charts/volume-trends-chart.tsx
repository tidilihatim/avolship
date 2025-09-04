'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis } from 'recharts';

interface VolumeData {
  date: string;
  created: number;
  resolved: number;
  pending: number;
}

interface VolumeTrendsChartProps {
  data: VolumeData[];
}

const chartConfig = {
  created: {
    label: "Created",
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  resolved: {
    label: "Resolved",
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  },
  pending: {
    label: "Pending",
    theme: {
      light: 'hsl(var(--chart-3))',
      dark: 'hsl(var(--chart-3))'
    }
  }
} satisfies ChartConfig;

export function VolumeTrendsChart({ data }: VolumeTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ticket Volume Trends</CardTitle>
          <CardDescription>No volume data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No tickets yet</p>
            <p className="text-xs mt-1">Volume trends will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCreated = data.reduce((sum, item) => sum + item.created, 0);
  const totalResolved = data.reduce((sum, item) => sum + item.resolved, 0);
  const currentPending = data[data.length - 1]?.pending || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ticket Volume Trends</CardTitle>
        <CardDescription>
          {totalCreated.toLocaleString()} created • {totalResolved.toLocaleString()} resolved • {currentPending.toLocaleString()} pending
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
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    `${value}`,
                    name === 'created' ? 'Created' : name === 'resolved' ? 'Resolved' : 'Pending'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="created"
              stroke="var(--color-created)"
              strokeWidth={2}
              dot={{ strokeWidth: 2, r: 3 }}
              name="created"
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="var(--color-resolved)"
              strokeWidth={2}
              dot={{ strokeWidth: 2, r: 3 }}
              name="resolved"
            />
            <Line
              type="monotone"
              dataKey="pending"
              stroke="var(--color-pending)"
              strokeWidth={2}
              dot={{ strokeWidth: 2, r: 3 }}
              name="pending"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
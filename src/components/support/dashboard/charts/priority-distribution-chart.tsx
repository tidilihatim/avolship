'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

interface TicketPriorityData {
  priority: string;
  count: number;
  percentage: number;
}

interface PriorityDistributionChartProps {
  data: TicketPriorityData[];
}

const getPriorityColor = (priority: string): string => {
  const priorityColors: Record<string, string> = {
    'critical': `hsl(var(--chart-1))`,
    'high': `hsl(var(--chart-2))`,
    'medium': `hsl(var(--chart-3))`,
    'low': `hsl(var(--chart-4))`
  };
  return priorityColors[priority] || `hsl(var(--chart-1))`;
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    'critical': 'Critical',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low'
  };
  return labels[priority] || priority;
};

const chartConfig = {
  count: {
    label: "Tickets",
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  }
} satisfies ChartConfig;

export function PriorityDistributionChart({ data }: PriorityDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
          <CardDescription>No priority data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No tickets yet</p>
            <p className="text-xs mt-1">Priority distribution will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    priority: getPriorityLabel(item.priority),
    count: item.count,
    percentage: item.percentage,
    fill: getPriorityColor(item.priority)
  }));

  const totalTickets = data.reduce((sum, item) => sum + item.count, 0);
  const criticalCount = data.find(item => item.priority === 'critical')?.count || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Priority Distribution</CardTitle>
        <CardDescription>
          {totalTickets.toLocaleString()} total tickets • {criticalCount} critical
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
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
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 11 }} 
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [`${value}`, 'Tickets']}
                  labelFormatter={(label) => `${label} Priority`}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
              name="count"
            />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-1 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
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
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';

interface TicketStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface TicketStatusChartProps {
  data: TicketStatusData[];
}

const getStatusColor = (status: string, index: number): string => {
  const statusColors: Record<string, string> = {
    'open': `hsl(var(--chart-1))`,
    'assigned': `hsl(var(--chart-2))`,
    'in_progress': `hsl(var(--chart-3))`,
    'resolved': `hsl(var(--chart-4))`,
    'closed': `hsl(var(--chart-5))`
  };
  
  return statusColors[status] || `hsl(var(--chart-${((index % 5) + 1)}))`;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'open': 'Open',
    'assigned': 'Assigned',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed'
  };
  return labels[status] || status.replace('_', ' ');
};

const chartConfig = {
  count: {
    label: "Tickets",
  },
} satisfies ChartConfig;

export function TicketStatusChart({ data }: TicketStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ticket Status Distribution</CardTitle>
          <CardDescription>No ticket data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No tickets yet</p>
            <p className="text-xs mt-1">Ticket status distribution will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    status: getStatusLabel(item.status),
    count: item.count,
    percentage: item.percentage,
    fill: getStatusColor(item.status, index),
  }));

  const totalTickets = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ticket Status Distribution</CardTitle>
        <CardDescription>
          Distribution of {totalTickets.toLocaleString()} total tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px] sm:h-[300px] lg:h-[350px] w-full"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="grid grid-cols-1 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: item.fill,
                    border: '1px solid hsl(var(--border))'
                  }}
                />
                <span className="text-muted-foreground">
                  {item.status}
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
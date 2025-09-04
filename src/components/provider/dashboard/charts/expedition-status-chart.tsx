'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';

interface ExpeditionStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface ExpeditionStatusChartProps {
  data: ExpeditionStatusData[];
}

const getStatusColor = (status: string, index: number): string => {
  const statusColors: Record<string, string> = {
    'pending': `hsl(var(--chart-1))`,
    'approved': `hsl(var(--chart-2))`,
    'in_transit': `hsl(var(--chart-3))`,
    'delivered': `hsl(var(--chart-4))`,
    'cancelled': `hsl(var(--chart-5))`,
    'rejected': `hsl(var(--chart-1))`
  };
  
  return statusColors[status] || `hsl(var(--chart-${((index % 5) + 1)}))`;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pending': 'Pending',
    'approved': 'Approved',
    'in_transit': 'In Transit',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'rejected': 'Rejected'
  };
  return labels[status] || status.replace('_', ' ');
};

const chartConfig = {
  count: {
    label: "Expeditions",
  },
} satisfies ChartConfig;

export function ExpeditionStatusChart({ data }: ExpeditionStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Expedition Status Distribution</CardTitle>
          <CardDescription>No expedition data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No expeditions yet</p>
            <p className="text-xs mt-1">Expedition status distribution will appear here</p>
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

  const totalExpeditions = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Expedition Status Distribution</CardTitle>
        <CardDescription>
          Distribution of {totalExpeditions.toLocaleString()} total expeditions
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
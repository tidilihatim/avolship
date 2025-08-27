'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { CallCenterChartData, CallStatus } from "@/app/actions/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface CallCenterChartProps {
  data: CallCenterChartData[];
  totalOrders: number;
  isLoading?: boolean;
}

const getStatusLabel = (status: CallStatus): string => {
  const labels: Record<CallStatus, string> = {
    'answered': 'Answered',
    'unreached': 'Unreached',
    'busy': 'Busy',
    'invalid': 'Invalid Number',
  };
  return labels[status] || status;
};

const getStatusColor = (status: CallStatus, index?: number): string => {
  const colors: Record<CallStatus, string> = {
    'answered': `hsl(var(--chart-1))`, // Green
    'unreached': `hsl(var(--chart-2))`, // Blue  
    'busy': `hsl(var(--chart-3))`, // Orange
    'invalid': `hsl(var(--chart-4))`, // Red
  };
  
  // Fallback to index-based colors if status mapping fails
  if (colors[status]) {
    return colors[status];
  }
  
  return `hsl(var(--chart-${((index || 0) % 5) + 1}))`;
};

const chartConfig = {
  count: {
    label: "Call Attempts",
  },
} satisfies ChartConfig;

const ChartSkeleton = () => (
  <Card className="flex flex-col">
    <CardHeader className="items-center pb-0">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="flex-1 pb-0">
      <div className="mx-auto aspect-square max-h-[250px] flex items-center justify-center">
        <Skeleton className="h-[250px] w-[250px] rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const BarChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent>
      <div className="h-[300px] flex items-end justify-between gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className={`w-12 h-${Math.floor(Math.random() * 20) + 10}`} />
        ))}
      </div>
    </CardContent>
  </Card>
);

export const CallCenterPieChart = ({ data, totalOrders, isLoading }: CallCenterChartProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Call Center Confirmation Status</CardTitle>
          <CardDescription>No call attempts found</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No call center data available</p>
            <p className="text-xs mt-1">Try adjusting your filters or check if there are any call attempts recorded</p>
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

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Call Center Confirmation Status</CardTitle>
        <CardDescription>Call attempt outcomes ({totalOrders} total attempts)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
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
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="h-3 w-3 rounded-full"
                style={{ 
                  backgroundColor: item.fill,
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <span className="flex-1">{item.status}</span>
              <span className="font-medium">{item.count} ({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const CallCenterBarChart = ({ data, totalOrders, isLoading }: CallCenterChartProps) => {
  if (isLoading) {
    return <BarChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Attempt Overview</CardTitle>
          <CardDescription>No call attempts found</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No call center data available</p>
            <p className="text-xs mt-1">Try adjusting your filters or check if there are any call attempts recorded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    status: getStatusLabel(item.status),
    count: item.count,
    fill: getStatusColor(item.status, index),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Attempt Overview</CardTitle>
        <CardDescription>Breakdown of call attempts by outcome ({totalOrders} total)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              className="text-xs"
              height={60}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" strokeWidth={2} radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
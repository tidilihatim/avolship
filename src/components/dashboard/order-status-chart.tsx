'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderStatusChartData {
  status: string;
  count: number;
  percentage: number;
}

interface OrderStatusChartProps {
  data: OrderStatusChartData[];
  totalOrders: number;
  isLoading?: boolean;
}

const getOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'cancelled': 'Cancelled',
    'shipped': 'Shipped',
    'assigned_to_delivery': 'Assigned to Delivery',
    'accepted_by_delivery': 'Accepted by Delivery',
    'in_transit': 'In Transit',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'delivery_failed': 'Delivery Failed',
    'refunded': 'Refunded',
    'wrong_number': 'Wrong Number',
    'double': 'Duplicate',
    'unreached': 'Unreached',
    'expired': 'Expired',
  };
  return labels[status] || status;
};


const chartConfig = {
  count: {
    label: "Orders",
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

export const OrderStatusPieChart = ({ data, totalOrders, isLoading }: OrderStatusChartProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Order Status Distribution</CardTitle>
          <CardDescription>No orders found</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No order data available</p>
            <p className="text-xs mt-1">Try adjusting your filters or check if there are any orders</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    status: getOrderStatusLabel(item.status),
    count: item.count,
    percentage: item.percentage,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`, // Each segment gets different color
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Order Status Distribution</CardTitle>
        <CardDescription>Order breakdown by status ({totalOrders} total orders)</CardDescription>
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

export const OrderStatusBarChart = ({ data, totalOrders, isLoading }: OrderStatusChartProps) => {
  if (isLoading) {
    return <BarChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Status Overview</CardTitle>
          <CardDescription>No orders found</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No order data available</p>
            <p className="text-xs mt-1">Try adjusting your filters or check if there are any orders</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    status: getOrderStatusLabel(item.status),
    count: item.count,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`, // Each bar gets different color
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status Overview</CardTitle>
        <CardDescription>Breakdown of orders by status ({totalOrders} total)</CardDescription>
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
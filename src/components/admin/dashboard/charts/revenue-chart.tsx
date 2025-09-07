'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { RevenueChart } from '@/app/actions/admin-dashboard';

interface RevenueChartProps {
  data: RevenueChart[];
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  },
  orders: {
    label: 'Orders',
    theme: {
      light: 'hsl(var(--chart-3))',
      dark: 'hsl(var(--chart-3))'
    }
  }
} satisfies ChartConfig;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  // Handle different date formats from backend
  
  // If it's already formatted (contains letters or W for week), return as is
  if (/[A-Za-z]/.test(dateString) || dateString.includes('W')) {
    return dateString;
  }
  
  // If it's YYYY-MM-DD format, format nicely
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  
  // If it's MM-DD HH:00 format, return as is
  if (/^\d{2}-\d{2} \d{2}:\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Fallback
  return dateString;
};

export function RevenueChartComponent({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>No revenue data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No revenue data found</p>
            <p className="text-xs mt-1">Revenue data will appear here once orders are delivered</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);

  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
    originalDate: item.date // Keep original for tooltip
  }));

  // Determine chart description based on data
  const getChartDescription = () => {
    if (data.length === 0) return "No data available";
    
    const hasMonthly = data.some(item => /^\w{3} \d{4}$/.test(item.date)); // Jan 2024
    const hasWeekly = data.some(item => item.date.includes('W')); // 2024 W5
    const hasHourly = data.some(item => /\d{2}:\d{2}$/.test(item.date)); // 10:00
    
    let granularity = 'daily';
    if (hasMonthly) granularity = 'monthly';
    else if (hasWeekly) granularity = 'weekly';
    else if (hasHourly) granularity = 'hourly';
    
    return `${formatCurrency(totalRevenue)} total revenue from ${totalOrders} delivered orders (${granularity} breakdown)`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>
          {getChartDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] lg:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={formattedData} 
              margin={{ 
                top: 20, 
                right: 15, 
                left: 15, 
                bottom: 60 
              }}
            >
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 11 }} 
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : `${value} orders`,
                    chartConfig[name as keyof typeof chartConfig]?.label
                  ]}
                  labelFormatter={(label) => `Period: ${label}`}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-2 rounded-full" />
            <div className="text-sm">
              <p className="text-muted-foreground">Total Revenue</p>
              <p className="font-medium">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-3 rounded-full" />
            <div className="text-sm">
              <p className="text-muted-foreground">Delivered Orders</p>
              <p className="font-medium">{totalOrders.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
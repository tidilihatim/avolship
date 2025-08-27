'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface StockMovementChartData {
  date: string;
  stockIn: number;
  stockOut: number;
  totalIn: number;
  totalOut: number;
}

interface StockMovementChartProps {
  data: StockMovementChartData[];
  isLoading?: boolean;
}

const chartConfig = {
  stockIn: {
    label: "Stock In",
  },
  stockOut: {
    label: "Stock Out", 
  },
} satisfies ChartConfig;

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent>
      <div className="h-[350px] flex items-end justify-between gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className={`w-8 h-${Math.floor(Math.random() * 20) + 10}`} />
        ))}
      </div>
    </CardContent>
  </Card>
);

export const StockMovementChart = ({ data, isLoading }: StockMovementChartProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Overview</CardTitle>
          <CardDescription>No stock movements found</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[350px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No stock movement data available</p>
            <p className="text-xs mt-1">Try adjusting your filters or date range</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    // Handle different date formats from the API
    if (dateString.includes(':')) {
      // Hour format (YYYY-MM-DD HH:00:00)
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        hour12: true
      });
    } else if (dateString.length === 7) {
      // Month format (YYYY-MM)
      const [year, month] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        year: 'numeric'
      });
    } else {
      // Day format (YYYY-MM-DD)
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  const chartData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
    fill: `hsl(var(--chart-1))`,
  }));

  const totalStockIn = data.reduce((sum, item) => sum + item.stockIn, 0);
  const totalStockOut = data.reduce((sum, item) => sum + item.stockOut, 0);
  const netMovement = totalStockIn - totalStockOut;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock In vs Stock Out</CardTitle>
        <CardDescription>
          Stock movement trends (Net: {netMovement > 0 ? '+' : ''}{netMovement} units)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 50,
            }}
          >
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              className="text-xs"
              height={40}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const stockInData = payload.find(p => p.dataKey === 'stockIn');
                  const stockOutData = payload.find(p => p.dataKey === 'stockOut');
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Stock In
                            </span>
                            <span className="font-bold text-green-600">
                              {data.stockIn} units ({data.totalIn} movements)
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Stock Out
                            </span>
                            <span className="font-bold text-red-600">
                              {data.stockOut} units ({data.totalOut} movements)
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Net Movement
                          </span>
                          <span className={`font-bold ${data.stockIn - data.stockOut > 0 ? 'text-green-600' : data.stockIn - data.stockOut < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {data.stockIn - data.stockOut > 0 ? '+' : ''}{data.stockIn - data.stockOut} units
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="stockIn"
              fill="hsl(var(--chart-1))"
              strokeWidth={2}
              radius={8}
            />
            <Bar
              dataKey="stockOut"
              fill="hsl(var(--chart-2))"
              strokeWidth={2}
              radius={8}
            />
          </BarChart>
        </ChartContainer>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="font-bold text-lg text-green-600">
              {totalStockIn}
            </div>
            <div className="text-muted-foreground">Total Stock In</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="font-bold text-lg text-red-600">
              {totalStockOut}
            </div>
            <div className="text-muted-foreground">Total Stock Out</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className={`font-bold text-lg ${netMovement > 0 ? 'text-green-600' : netMovement < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
              {netMovement > 0 ? '+' : ''}{netMovement}
            </div>
            <div className="text-muted-foreground">Net Movement</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
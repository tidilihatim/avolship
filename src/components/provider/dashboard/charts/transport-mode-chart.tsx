'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

interface TransportModeData {
  mode: string;
  count: number;
  percentage: number;
  weight: number;
}

interface TransportModeChartProps {
  data: TransportModeData[];
}

const getModeLabel = (mode: string): string => {
  const labels: Record<string, string> = {
    'road': 'Road',
    'railway': 'Railway',
    'air': 'Air',
    'maritime': 'Maritime'
  };
  return labels[mode] || mode;
};

const chartConfig = {
  count: {
    label: "Expeditions",
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  },
  weight: {
    label: "Weight (kg)",
    theme: {
      light: 'hsl(var(--chart-2))',
      dark: 'hsl(var(--chart-2))'
    }
  }
} satisfies ChartConfig;

export function TransportModeChart({ data }: TransportModeChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transport Mode Distribution</CardTitle>
          <CardDescription>No transport mode data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No expeditions yet</p>
            <p className="text-xs mt-1">Transport mode distribution will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    mode: getModeLabel(item.mode),
    count: item.count,
    weight: item.weight,
    percentage: item.percentage
  }));

  const totalExpeditions = data.reduce((sum, item) => sum + item.count, 0);
  const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transport Mode Distribution</CardTitle>
        <CardDescription>
          {totalExpeditions.toLocaleString()} expeditions • {totalWeight.toLocaleString()} kg total weight
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
              dataKey="mode" 
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
                  formatter={(value, name) => [
                    name === 'weight' ? `${Number(value).toLocaleString()} kg` : `${value}`,
                    name === 'weight' ? 'Total Weight' : 'Expeditions'
                  ]}
                  labelFormatter={(label) => `${label}`}
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
                    backgroundColor: `hsl(var(--chart-${((index % 5) + 1)}))`,
                    border: '1px solid hsl(var(--border))'
                  }}
                />
                <span className="text-muted-foreground">
                  {item.mode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.count}</span>
                <span className="text-xs text-muted-foreground">
                  ({item.percentage}% • {item.weight.toLocaleString()}kg)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
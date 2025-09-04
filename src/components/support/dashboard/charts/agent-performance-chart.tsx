'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

interface AgentPerformanceData {
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
}

interface AgentPerformanceChartProps {
  data: AgentPerformanceData[];
}

const chartConfig = {
  assignedTickets: {
    label: "Assigned",
    theme: {
      light: 'hsl(var(--chart-3))',
      dark: 'hsl(var(--chart-3))'
    }
  },
  resolvedTickets: {
    label: "Resolved",
    theme: {
      light: 'hsl(var(--chart-4))',
      dark: 'hsl(var(--chart-4))'
    }
  }
} satisfies ChartConfig;

export function AgentPerformanceChart({ data }: AgentPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>No agent performance data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No agent assignments yet</p>
            <p className="text-xs mt-1">Agent performance metrics will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAssigned = data.reduce((sum, item) => sum + item.assignedTickets, 0);
  const totalResolved = data.reduce((sum, item) => sum + item.resolvedTickets, 0);
  const overallResolutionRate = totalAssigned > 0 ? Math.round((totalResolved / totalAssigned) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
        <CardDescription>
          {data.length} agents • {totalAssigned.toLocaleString()} assigned • {overallResolutionRate}% resolution rate
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
              dataKey="agentName" 
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
                    name === 'assignedTickets' ? 'Assigned' : 'Resolved'
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
              }
            />
            <Bar
              dataKey="assignedTickets"
              fill="var(--color-assignedTickets)"
              radius={[4, 4, 0, 0]}
              name="assignedTickets"
            />
            <Bar
              dataKey="resolvedTickets"
              fill="var(--color-resolvedTickets)"
              radius={[4, 4, 0, 0]}
              name="resolvedTickets"
            />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-1 gap-2 mt-4">
          {data.map((item, index) => {
            const resolutionRate = item.assignedTickets > 0 ? 
              Math.round((item.resolvedTickets / item.assignedTickets) * 100) : 0;
            
            return (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {item.agentName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.assignedTickets}</span>
                  <span className="text-xs text-muted-foreground">
                    assigned • {item.resolvedTickets} resolved ({resolutionRate}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
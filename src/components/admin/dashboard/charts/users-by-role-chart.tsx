'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { UsersByRole } from '@/app/actions/admin-dashboard';

interface UsersByRoleChartProps {
  data: UsersByRole[];
}

const getRoleColor = (role: string, index: number): string => {
  const roleColors: Record<string, string> = {
    'ADMIN': `hsl(var(--chart-1))`,
    'SELLER': `hsl(var(--chart-2))`,
    'DELIVERY': `hsl(var(--chart-3))`,
    'PROVIDER': `hsl(var(--chart-4))`,
    'SUPPORT': `hsl(var(--chart-5))`,
    'CALL_CENTER': `hsl(var(--chart-1))`,
    'MODERATOR': `hsl(var(--chart-2))`
  };
  
  // Fallback to index-based colors if role mapping fails
  if (roleColors[role]) {
    return roleColors[role];
  }
  
  return `hsl(var(--chart-${((index % 5) + 1)}))`;
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'ADMIN': 'Admin',
    'SELLER': 'Seller',
    'DELIVERY': 'Delivery',
    'PROVIDER': 'Provider',
    'SUPPORT': 'Support',
    'CALL_CENTER': 'Call Center',
    'MODERATOR': 'Moderator'
  };
  return labels[role] || role;
};

const chartConfig = {
  count: {
    label: "Users",
  },
} satisfies ChartConfig;

export function UsersByRoleChart({ data }: UsersByRoleChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
          <CardDescription>No user data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No users found</p>
            <p className="text-xs mt-1">User data will appear here once available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    role: getRoleLabel(item.role),
    count: item.count,
    percentage: item.percentage,
    fill: getRoleColor(item.role, index),
  }));

  const totalUsers = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users by Role</CardTitle>
        <CardDescription>
          Distribution of {totalUsers.toLocaleString()} users across different roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px] sm:h-[300px] lg:h-[350px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="role"
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
        <div className="grid grid-cols-2 gap-2 mt-4">
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
                  {item.role}
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
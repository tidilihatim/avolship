'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { useTranslations } from 'next-intl';
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

// Role labels will be translated in the component

const chartConfig = {
  count: {
    label: "Users",
  },
} satisfies ChartConfig;

export function UsersByRoleChart({ data }: UsersByRoleChartProps) {
  const t = useTranslations('admin.dashboard.charts.usersByRole');
  const tRoles = useTranslations('admin.dashboard.roles');
  
  const getRoleLabel = (role: string): string => {
    return tRoles(role?.toUpperCase() as any);
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noUsers')}</p>
            <p className="text-xs mt-1">{t('noUsersMessage')}</p>
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
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description', { count: totalUsers.toLocaleString() })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Chart */}
          <div className="flex-1 min-w-0">
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
                  outerRadius="70%"
                  innerRadius="40%"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>

          {/* Legend */}
          <div className="lg:w-48 lg:min-w-[12rem]">
            <div className="space-y-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: item.fill,
                        border: '1px solid hsl(var(--border))'
                      }}
                    />
                    <span className="text-muted-foreground truncate text-xs sm:text-sm">
                      {item.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span className="font-medium text-xs sm:text-sm">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
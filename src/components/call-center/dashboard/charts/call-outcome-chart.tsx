'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';

interface CallOutcome {
  name: string;
  value: number;
  count: number;
  className: string;
}

interface CallOutcomeChartProps {
  data: CallOutcome[];
  total: number;
}

const getOutcomeColor = (name: string): string => {
  const colorMap: Record<string, string> = {
    'Answered': `hsl(var(--chart-1))`,
    'No Answer': `hsl(var(--chart-2))`,
    'Busy': `hsl(var(--chart-3))`,
    'Invalid Number': `hsl(var(--chart-4))`
  };
  
  return colorMap[name] || `hsl(var(--chart-1))`;
};

const chartConfig = {
  value: {
    label: 'Calls'
  }
} satisfies ChartConfig;

export function CallOutcomeChart({ data, total }: CallOutcomeChartProps) {
  const t = useTranslations('callCenterDashboard.charts.callOutcomes');

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noCalls')}</p>
            <p className="text-xs mt-1">{t('dataWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    name: item.name,
    value: item.count,
    percentage: item.value,
    fill: getOutcomeColor(item.name),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('distribution', { total: total.toLocaleString() })}
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
              dataKey="value"
              nameKey="name"
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
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{item.value}</span>
                <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
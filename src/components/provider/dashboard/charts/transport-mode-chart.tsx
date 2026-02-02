'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('providerDashboard');

  const getModeLabel = (mode: string): string => {
    const modeKey = mode as keyof typeof modeLabels;
    const modeLabels = {
      'road': t('transportModes.road'),
      'railway': t('transportModes.railway'),
      'air': t('transportModes.air'),
      'maritime': t('transportModes.maritime')
    };
    return modeLabels[modeKey] || mode;
  };

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('charts.transportMode.title')}</CardTitle>
          <CardDescription>{t('charts.transportMode.noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('charts.transportMode.noExpeditions')}</p>
            <p className="text-xs mt-1">{t('charts.transportMode.noExpeditionsDesc')}</p>
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
        <CardTitle>{t('charts.transportMode.title')}</CardTitle>
        <CardDescription>
          {t('charts.transportMode.summary', {
            count: totalExpeditions.toLocaleString(),
            weight: totalWeight.toLocaleString()
          })}
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
                    name === 'weight' ? t('charts.transportMode.totalWeight') : t('charts.transportMode.expeditionsLabel')
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
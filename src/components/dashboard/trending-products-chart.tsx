'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingProductData } from "@/app/actions/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from 'next-intl';

interface TrendingProductsChartProps {
  data: TrendingProductData[];
  totalOrders: number;
  isLoading?: boolean;
}

const getChartConfig = (t: any) => ({
  orderCount: {
    label: t('orders'),
  },
} satisfies ChartConfig);

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent>
      <div className="h-[250px] flex items-end justify-between gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className={`w-8 h-${Math.floor(Math.random() * 15) + 8}`} />
        ))}
      </div>
    </CardContent>
  </Card>
);

export const TrendingProductsChart = ({ data, totalOrders, isLoading }: TrendingProductsChartProps) => {
  const t = useTranslations('dashboard.seller.charts.trendingProducts');
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('noDataTitle')}</CardTitle>
          <CardDescription>{t('noDataDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[250px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noDataMessage')}</p>
            <p className="text-xs mt-1">{t('noDataHint')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    product: `${item.productCode}`, // Show product code on x-axis
    productName: item.productName,
    orderCount: item.orderCount,
    percentage: item.percentage,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`, // Each product gets different color
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description', { totalOrders: totalOrders })}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={getChartConfig(t)} className="h-[250px]">
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
              dataKey="product"
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
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {t('product')}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {data.productName}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {t('orders')}
                          </span>
                          <span className="font-bold">
                            {data.orderCount} ({data.percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="orderCount" strokeWidth={2} radius={8} />
          </BarChart>
        </ChartContainer>
        
        {/* Product details list */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">{t('topProducts')}</h4>
          {chartData.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                     style={{ backgroundColor: item.fill }}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-xs text-muted-foreground">{t('code')} {item.product}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{item.orderCount}</div>
                <div className="text-xs text-muted-foreground">{t('ordersLabel')} ({item.percentage}%)</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
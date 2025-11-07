'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { BadgeCheck, Filter } from 'lucide-react';

interface ConfirmationRateData {
  period: string;
  rate: number | null;
  total: number;
  confirmed: number;
}

interface Seller {
  sellerId: string;
  sellerName: string;
}

interface SellerConfirmationRateChartProps {
  data: ConfirmationRateData[];
  sellers: Seller[];
  overallRate: number;
  totalOrders: number;
  confirmedOrders: number;
  selectedSellerId?: string;
}

const chartConfig = {
  rate: {
    label: 'Confirmation Rate',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export function SellerConfirmationRateChart({
  data,
  sellers,
  overallRate,
  totalOrders,
  confirmedOrders,
  selectedSellerId,
}: SellerConfirmationRateChartProps) {
  const t = useTranslations('adminSellerAnalytics.charts.confirmationRate');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSellerChange = (sellerId: string) => {
    const params = new URLSearchParams(searchParams);
    if (sellerId === 'all') {
      params.delete('sellerId');
    } else {
      params.set('sellerId', sellerId);
    }
    startTransition(() => {
      router.push(`/dashboard/admin/seller-analytics?${params.toString()}`, { scroll: false });
    });
  };

  const selectedSeller = sellers.find((s) => s.sellerId === selectedSellerId);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeCheck className="w-5 h-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>

        {/* Seller Filter */}
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('sellerFilter')}</span>
          </div>
          <Select
            value={selectedSellerId || 'all'}
            onValueChange={handleSellerChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allSellers')}</SelectItem>
              {sellers.map((seller) => (
                <SelectItem key={seller.sellerId} value={seller.sellerId}>
                  {seller.sellerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSeller && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('showing')}: {selectedSeller.sellerName}
            </p>
          )}
          {!selectedSellerId && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('showingAll', { count: sellers.length })}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                label={{
                  value: t('yAxisLabel'),
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
                domain={[0, 100]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `${value}`}
                    formatter={(value, name, props) => {
                      const payload = props.payload;
                      return [
                        <div key="tooltip-value" className="space-y-1">
                          <div>
                            <span className="font-medium">{value}%</span> {t('confirmed')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payload.confirmed} / {payload.total} {t('orders')}
                          </div>
                        </div>,
                        t('rate'),
                      ];
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-4))', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">{t('overallRate')}</div>
            <div className="text-2xl font-bold">{overallRate}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">{t('totalOrders')}</div>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">{t('confirmedOrders')}</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {confirmedOrders}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { XCircle, Filter } from 'lucide-react';

interface RefundedOrdersData {
  period: string;
  count: number;
}

interface Seller {
  sellerId: string;
  sellerName: string;
}

interface RefundedOrdersChartProps {
  data: RefundedOrdersData[];
  sellers: Seller[];
  totalRefunded: number;
  selectedSellerId?: string;
}

const chartConfig = {
  count: {
    label: 'Refunded Orders',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

export function RefundedOrdersChart({
  data,
  sellers,
  totalRefunded,
  selectedSellerId,
}: RefundedOrdersChartProps) {
  const t = useTranslations('adminSellerAnalytics.charts.refundedOrders');
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
          <XCircle className="w-5 h-5" />
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
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `${value}`}
                    formatter={(value, name) => [
                      <span key="tooltip-value">
                        <span className="font-medium">{value}</span> {t('orders')}
                      </span>,
                      t('count'),
                    ]}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--destructive))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">{t('totalRefunded')}</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {totalRefunded.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

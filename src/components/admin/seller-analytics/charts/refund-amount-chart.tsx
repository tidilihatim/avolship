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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { DollarSign, Filter } from 'lucide-react';

interface RefundAmountData {
  period: string;
  amount: number;
}

interface Seller {
  sellerId: string;
  sellerName: string;
}

interface RefundAmountChartProps {
  data: RefundAmountData[];
  sellers: Seller[];
  totalRefundAmount: number;
  currency: string;
  selectedSellerId?: string;
}

const chartConfig = {
  amount: {
    label: 'Refund Amount',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

export function RefundAmountChart({
  data,
  sellers,
  totalRefundAmount,
  currency,
  selectedSellerId,
}: RefundAmountChartProps) {
  const t = useTranslations('adminSellerAnalytics.charts.refundAmount');
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
          <DollarSign className="w-5 h-5" />
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
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="refundAmountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(value) => formatCurrency(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `${value}`}
                    formatter={(value, name) => [
                      <span key="tooltip-value">
                        <span className="font-medium">{formatCurrency(Number(value))}</span>
                      </span>,
                      t('amount'),
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--destructive))"
                fill="url(#refundAmountGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">{t('totalRefundAmount')}</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalRefundAmount)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

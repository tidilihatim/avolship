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

interface RevenueData {
  period: string;
  revenue: number;
}

interface Seller {
  sellerId: string;
  sellerName: string;
}

interface SellerRevenueChartProps {
  data: RevenueData[];
  sellers: Seller[];
  totalRevenue: number;
  currency: string;
  selectedSellerId?: string;
  selectedInvoiceStatus?: string;
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function SellerRevenueChart({
  data,
  sellers,
  totalRevenue,
  currency,
  selectedSellerId,
  selectedInvoiceStatus,
}: SellerRevenueChartProps) {
  const t = useTranslations('adminSellerAnalytics.charts.revenue');
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

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'all') {
      params.delete('invoiceStatus');
    } else {
      params.set('invoiceStatus', status);
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

        {/* Filters */}
        <div className="pt-4 space-y-4">
          {/* Seller Filter */}
          <div>
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

          {/* Invoice Status Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('statusFilter')}</span>
            </div>
            <Select
              value={selectedInvoiceStatus || 'all'}
              onValueChange={handleStatusChange}
              disabled={isPending}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="paid">{t('statusPaid')}</SelectItem>
                <SelectItem value="generated">{t('statusGenerated')}</SelectItem>
                <SelectItem value="draft">{t('statusDraft')}</SelectItem>
                <SelectItem value="overdue">{t('statusOverdue')}</SelectItem>
                <SelectItem value="cancelled">{t('statusCancelled')}</SelectItem>
              </SelectContent>
            </Select>
            {selectedInvoiceStatus && selectedInvoiceStatus !== 'all' && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('showingStatus')}: {t(`status${selectedInvoiceStatus.charAt(0).toUpperCase() + selectedInvoiceStatus.slice(1)}`)}
              </p>
            )}
            {(!selectedInvoiceStatus || selectedInvoiceStatus === 'all') && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('showingAllStatuses')}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
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
                    formatter={(value) => [
                      <span key="tooltip-value" className="font-medium">
                        {formatCurrency(value as number)}
                      </span>,
                      t('revenue'),
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">{t('totalRevenue')}</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

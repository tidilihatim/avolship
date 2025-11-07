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
import { FileCheck, Filter } from 'lucide-react';

interface ProcessedOrdersData {
  period: string;
  count: number;
}

interface Seller {
  sellerId: string;
  sellerName: string;
}

interface ProcessedOrdersChartProps {
  data: ProcessedOrdersData[];
  sellers: Seller[];
  totalProcessed: number;
  selectedSellerId?: string;
  selectedInvoiceStatus?: string;
}

const chartConfig = {
  count: {
    label: 'Processed Orders',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function ProcessedOrdersChart({
  data,
  sellers,
  totalProcessed,
  selectedSellerId,
  selectedInvoiceStatus,
}: ProcessedOrdersChartProps) {
  const t = useTranslations('adminSellerAnalytics.charts.processedOrders');
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
          <FileCheck className="w-5 h-5" />
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
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">{t('totalProcessed')}</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalProcessed.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

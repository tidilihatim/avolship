'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslations } from 'next-intl';
import { RefundRateChart } from '@/app/actions/admin-dashboard';
import { Loader2 } from 'lucide-react';

interface RefundRateChartProps {
  data: RefundRateChart[];
  loading: boolean;
  onSellerChange: (sellerId: string | undefined) => void;
  sellers: Array<{ _id: string; name: string; businessName?: string }>;
}

const chartConfig = {
  refundRate: {
    label: 'Refund Rate',
    theme: {
      light: 'hsl(var(--chart-5))',
      dark: 'hsl(var(--chart-5))'
    }
  }
} satisfies ChartConfig;

const formatDate = (dateString: string) => {
  // Handle different date formats from backend

  // If it's already formatted (contains letters or W for week), return as is
  if (/[A-Za-z]/.test(dateString) || dateString.includes('W')) {
    return dateString;
  }

  // If it's YYYY-MM-DD format, format nicely
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  // If it's MM-DD HH:00 format, return as is
  if (/^\d{2}-\d{2} \d{2}:\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Fallback
  return dateString;
};

export function RefundRateChartComponent({ data, loading, onSellerChange, sellers }: RefundRateChartProps) {
  const t = useTranslations('admin.dashboard.charts.refundRate');
  const [selectedSeller, setSelectedSeller] = useState<string | undefined>(undefined);

  const handleSellerChange = (value: string) => {
    const newValue = value === 'all' ? undefined : value;
    setSelectedSeller(newValue);
    onSellerChange(newValue);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('noData')}</CardDescription>
            </div>
            <div className="w-[200px]">
              <Select value={selectedSeller || 'all'} onValueChange={handleSellerChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectSeller')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allSellers')}</SelectItem>
                  {sellers.map((seller) => (
                    <SelectItem key={seller._id} value={seller._id}>
                      {seller.businessName
                        ? `${seller.businessName} (${seller.name})`
                        : seller.name
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noDataFound')}</p>
            <p className="text-xs mt-1">{t('noDataMessage')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRefunded = data.reduce((sum, item) => sum + item.refundedOrders, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.totalOrders, 0);
  const averageRefundRate = totalOrders > 0 ? (totalRefunded / totalOrders) * 100 : 0;

  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
    originalDate: item.date // Keep original for tooltip
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <div className="w-[200px]">
            <Select value={selectedSeller || 'all'} onValueChange={handleSellerChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectSeller')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allSellers')}</SelectItem>
                {sellers.map((seller) => (
                  <SelectItem key={seller._id} value={seller._id}>
                    {seller.businessName
                      ? `${seller.businessName} (${seller.name})`
                      : seller.name
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
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
                    style: { fontSize: 12 }
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value, payload) => {
                        if (payload && payload[0]) {
                          const originalDate = (payload[0].payload as any).originalDate;
                          return `${t('tooltipPeriod', { label: originalDate || value })}`;
                        }
                        return value;
                      }}
                      formatter={(value, name, props) => {
                        const item = props.payload as RefundRateChart;
                        return [
                          `${value}% (${item.refundedOrders}/${item.totalOrders})`,
                          t('refundRate')
                        ];
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="refundRate"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-5))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t('averageRate')}</p>
            <p className="text-2xl font-bold">{averageRefundRate.toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t('totalRefunded')}</p>
            <p className="text-2xl font-bold">{totalRefunded.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t('totalOrders')}</p>
            <p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

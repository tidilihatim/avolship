'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { PendingPayoutsData } from '@/app/actions/admin-dashboard';
import { Loader2 } from 'lucide-react';

interface PendingPayoutsChartProps {
  data: PendingPayoutsData;
  loading: boolean;
  onSellerChange: (sellerId: string | undefined) => void;
  sellers: Array<{ _id: string; name: string; businessName?: string }>;
}

export function PendingPayoutsChartComponent({
  data,
  loading,
  onSellerChange,
  sellers
}: PendingPayoutsChartProps) {
  const t = useTranslations('admin.dashboard.charts.pendingPayouts');
  const [selectedSeller, setSelectedSeller] = useState<string | undefined>(undefined);

  const handleSellerChange = (value: string) => {
    const newValue = value === 'all' ? undefined : value;
    setSelectedSeller(newValue);
    onSellerChange(newValue);
  };

  // Show message when warehouse selection is required
  if (!data.currency) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm font-medium">{t('warehouseRequired')}</p>
            <p className="text-xs mt-1">{t('warehouseRequiredMessage')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Total Orders Pending */}
            <div className="space-y-2 p-6 rounded-lg border bg-card">
              <p className="text-sm font-medium text-muted-foreground">
                {t('totalOrders')}
              </p>
              <p className="text-3xl font-bold">
                {data.totalOrders.toLocaleString()}
              </p>
            </div>

            {/* Total Amount Pending */}
            <div className="space-y-2 p-6 rounded-lg border bg-card">
              <p className="text-sm font-medium text-muted-foreground">
                {t('totalAmount')}
              </p>
              <p className="text-3xl font-bold">
                {data.currency} {data.totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>
        )}

        {!loading && data.totalOrders === 0 && (
          <div className="text-center text-muted-foreground mt-8">
            <p className="text-sm">{t('noOrdersFound')}</p>
            <p className="text-xs mt-1">{t('noDataMessage')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

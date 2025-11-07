'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/call-center/date-range-filter';
import { Warehouse as WarehouseIcon } from 'lucide-react';

interface Warehouse {
  _id: string;
  name: string;
  currency: string;
  country: string;
  city: string;
}

interface AdminFinanceDashboardClientProps {
  warehouses: Warehouse[];
  selectedWarehouseId?: string;
  children: React.ReactNode;
}

export function AdminFinanceDashboardClient({
  warehouses,
  selectedWarehouseId,
  children,
}: AdminFinanceDashboardClientProps) {
  const t = useTranslations('adminFinanceDashboard');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleWarehouseChange = (newWarehouseId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('warehouseId', newWarehouseId);
    startTransition(() => {
      router.push(`/dashboard/admin/finance?${params.toString()}`, { scroll: false });
    });
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    startTransition(() => {
      router.push(`/dashboard/admin/finance?${params.toString()}`, { scroll: false });
    });
  };

  const selectedWarehouse = warehouses.find((w) => w._id === selectedWarehouseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('description')}</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Selector Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <WarehouseIcon className="w-5 h-5" />
              {t('warehouseFilter.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Select
                value={selectedWarehouseId || ''}
                onValueChange={handleWarehouseChange}
                disabled={isPending || warehouses.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('warehouseFilter.selectWarehouse')} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse._id} value={warehouse._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{warehouse.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {warehouse.city}, {warehouse.country} • {warehouse.currency}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedWarehouse && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <WarehouseIcon className="w-4 h-4" />
                  <span>
                    {t('warehouseFilter.selectedWarehouse', {
                      name: selectedWarehouse.name,
                      currency: selectedWarehouse.currency,
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date Range Filter */}
        <DateRangeFilter onDateRangeChange={handleDateRangeChange} defaultRange="last30days" />
      </div>

      {/* Charts and KPIs */}
      <div className="grid gap-6">{children}</div>
    </div>
  );
}

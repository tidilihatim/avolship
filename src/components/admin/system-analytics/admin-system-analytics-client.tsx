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
import { Warehouse as WarehouseIcon } from 'lucide-react';

interface Warehouse {
  _id: string;
  name: string;
  currency: string;
  country: string;
  city: string;
}

interface AdminSystemAnalyticsClientProps {
  warehouses: Warehouse[];
  selectedWarehouseId?: string;
  children: React.ReactNode;
}

export function AdminSystemAnalyticsClient({
  warehouses,
  selectedWarehouseId,
  children,
}: AdminSystemAnalyticsClientProps) {
  const t = useTranslations('adminSystemAnalytics');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleWarehouseChange = (newWarehouseId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('warehouseId', newWarehouseId);
    startTransition(() => {
      router.push(`/dashboard/admin/system?${params.toString()}`, { scroll: false });
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

      {/* Warehouse Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5" />
            {t('selectWarehouse')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedWarehouseId || ''}
            onValueChange={handleWarehouseChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder={t('selectWarehousePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse._id} value={warehouse._id}>
                  {warehouse.name} ({warehouse.city}, {warehouse.country})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedWarehouse && (
            <p className="text-sm text-muted-foreground mt-2">
              {t('selectedWarehouse')}: <span className="font-medium">{selectedWarehouse.name}</span> -{' '}
              {selectedWarehouse.currency}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      {children}
    </div>
  );
}

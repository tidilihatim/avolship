'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Package, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getWarehousesForOrder } from '@/app/actions/order';

interface Warehouse {
  _id: string;
  name: string;
  country: string;
  currency: string;
}

interface WarehouseSelectorProps {
  selectedWarehouse: string;
  onWarehouseChange: (warehouseId: string) => void;
}

export default function WarehouseSelector({ selectedWarehouse, onWarehouseChange }: WarehouseSelectorProps) {
  const t = useTranslations('orders.import.warehouseSelection');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setIsLoading(true);
      const result = await getWarehousesForOrder();
      if (result.success) {
        setWarehouses(result.warehouses || []);
      } else {
        toast.error(result.message || 'Failed to load warehouses');
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      toast.error('Failed to load warehouses');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedWarehouse} onValueChange={onWarehouseChange} disabled={isLoading}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder={t('placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse._id} value={warehouse._id}>
                {warehouse.name} ({warehouse.country}) - {warehouse.currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {warehouses.length === 0 && !isLoading && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('noWarehouses')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
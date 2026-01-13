"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getWarehouses } from '@/app/actions/app-settings';

interface Warehouse {
  _id: string;
  name: string;
  currency: string;
  country: string;
  city?: string;
}

interface WarehouseSelectorProps {
  value?: string;
  onValueChange: (warehouseId: string, currency: string) => void;
  placeholder?: string;
}

export function WarehouseSelector({ 
  value, 
  onValueChange, 
  placeholder 
}: WarehouseSelectorProps) {
  const t = useTranslations('settings.warehouseSelector');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  
  const defaultPlaceholder = placeholder || t('selectWarehouse');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (value && warehouses.length > 0) {
      const warehouse = warehouses.find(w => w._id === value);
      if (warehouse) {
        setSelectedCurrency(warehouse.currency);
      }
    } else {
      // Clear currency badge when no warehouse is selected
      setSelectedCurrency("");
    }
  }, [value, warehouses]);

  const fetchWarehouses = async () => {
    try {
      const result = await getWarehouses();
      if (result.success) {
        setWarehouses(result.data);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    if (warehouse) {
      setSelectedCurrency(warehouse.currency);
      onValueChange(warehouseId, warehouse.currency);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder={t('loadingWarehouses')} />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={defaultPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {warehouses.map((warehouse) => (
          <SelectItem key={warehouse._id} value={warehouse._id}>
            <div className="flex items-center justify-between w-full">
              <span>{warehouse.name}</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {warehouse.currency}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
"use client";

import React, { useState, useEffect } from 'react';
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
  placeholder = "Select warehouse..." 
}: WarehouseSelectorProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (value && warehouses.length > 0) {
      const warehouse = warehouses.find(w => w._id === value);
      if (warehouse) {
        setSelectedCurrency(warehouse.currency);
      }
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
            <SelectValue placeholder="Loading warehouses..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse._id} value={warehouse._id}>
              <div className="flex items-center justify-between w-full">
                <span>{warehouse.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {warehouse.currency}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedCurrency && (
        <Badge variant="outline" className="text-xs">
          Currency: {selectedCurrency}
        </Badge>
      )}
    </div>
  );
}
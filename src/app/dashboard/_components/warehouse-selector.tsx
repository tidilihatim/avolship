'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Warehouse as WarehouseIcon, Check, ChevronsUpDown, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Warehouse } from '@/types/warehouse';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWarehouse } from '@/context/warehouse';
import { COUNTRY_FLAGS } from '../_constant';



/**
 * Get country flag image URL
 * @param country - Country name
 * @returns Flag image URL
 */
const getCountryFlag = (country: string): string => {
  return COUNTRY_FLAGS[country] || 'https://img.icons8.com/?size=100&id=t0pRVC1Kipju&format=png&color=000000'; // Default to world icon
};

/**
 * WarehouseSelector Component
 * Allows users to select a warehouse from a dropdown
 */
export default function WarehouseSelector() {
  const t = useTranslations('warehouse');
  const [open, setOpen] = useState(false);
  const { selectedWarehouse, warehouses, isLoading, setSelectedWarehouse } = useWarehouse();

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-[200px] rounded-md" />
      </div>
    );
  }

  // If no warehouses, show a message
  if (warehouses.length === 0) {
    return (
      <div className="flex items-center">
        <Badge variant="outline" className="px-3 py-1 text-xs bg-destructive/10 text-destructive border-destructive/20">
          {t('selector.noWarehouses')}
        </Badge>
      </div>
    );
  }

  // Get flag for selected warehouse
  const selectedFlag = selectedWarehouse ? getCountryFlag(selectedWarehouse.country) : "";

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a warehouse"
            className="w-[240px] justify-between border-border hover:bg-muted/50"
          >
            <div className="flex items-center gap-2 truncate">
              {selectedWarehouse ? (
                <div className="w-5 h-5 relative overflow-hidden rounded-sm">
                  <img src={selectedFlag} alt={selectedWarehouse.country} className="object-cover w-full h-full" />
                </div>
              ) : (
                <WarehouseIcon className="h-4 w-4 text-primary" />
              )}
              <span className="truncate">
                {selectedWarehouse ? selectedWarehouse.name : t('selector.selectWarehouse')}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder={t('selector.search')} />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t('selector.noResults')}
                </div>
              </CommandEmpty>
              <CommandGroup heading={t('selector.availableWarehouses')}>
                {warehouses.map((warehouse) => (
                  <CommandItem
                    key={warehouse._id}
                    value={warehouse.name + ' ' + warehouse.country}
                    onSelect={() => {
                      setSelectedWarehouse(warehouse);
                      setOpen(false);
                    }}
                    className="flex cursor-pointer items-start py-2 px-2"
                  >
                    <div className="flex w-full justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 relative overflow-hidden rounded-sm flex-shrink-0">
                          <img 
                            src={getCountryFlag(warehouse.country)} 
                            alt={warehouse.country} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{warehouse.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {warehouse.city ? `${warehouse.city}, ` : ''}{warehouse.country} ({warehouse.currency})
                          </span>
                        </div>
                      </div>
                      {selectedWarehouse?._id === warehouse._id && (
                        <Check className="h-4 w-4 text-primary ml-2" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
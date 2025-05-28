'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Edit, ArrowLeft, Building2, Globe, BarChart, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { Warehouse, commonCurrencies } from '@/types/warehouse';
import { updateCurrencySettings } from '@/app/actions/warehouse';
import WarehouseSettings from './warehouse-setting';

interface WarehouseDetailsProps {
  warehouse: Warehouse;
}

/**
 * WarehouseDetails Component
 * Displays detailed information about a warehouse
 */
export default function WarehouseDetails({ warehouse }: WarehouseDetailsProps) {
  const t = useTranslations('warehouse');
  const router = useRouter();
  

  // Get currency details
  const warehouseCurrency = commonCurrencies.find(c => c.code === warehouse.currency) || { 
    code: warehouse.currency, 
    name: warehouse.currency, 
    symbol: warehouse.currency 
  };
  
  const targetCurrency = commonCurrencies.find(c => c.code === warehouse.currencyConversion.targetCurrency) || { 
    code: warehouse.currencyConversion.targetCurrency, 
    name: warehouse.currencyConversion.targetCurrency, 
    symbol: warehouse.currencyConversion.targetCurrency 
  };
  
  // Handle currency settings update
  const handleCurrencySettingsUpdate = async (data: {
    enabled: boolean;
    targetCurrency: string;
    rate: number;
    autoUpdate: boolean;
  }) => {
    const result = await updateCurrencySettings(warehouse._id, data);
    
    if (result.warehouse) {
      toast(t('messages.currencySettingsSuccess'));
      router.refresh();
    } else if (result.error) {
      toast(t('messages.error'));
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/admin/warehouse')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{warehouse.name}</h1>
          <Badge
            variant="outline"
            className={`${
              warehouse.isActive
                ? 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200'
                : 'bg-red-50 text-red-700 hover:bg-red-50 border-red-200'
            }`}
          >
            {warehouse.isActive ? t('filters.active') : t('filters.inactive')}
          </Badge>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => router.push(`/dashboard/admin/warehouse/${warehouse._id}/edit`)}
        >
          <Edit className="h-4 w-4" />
          {t('actions.edit')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('details.basicInfo')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('table.name')}
                </p>
                <p className="text-base">{warehouse.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('details.createdAt')}
                </p>
                <p className="text-base">
                  {format(new Date(warehouse.createdAt), 'PPP')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('details.updatedAt')}
                </p>
                <p className="text-base">
                  {format(new Date(warehouse.updatedAt), 'PPP')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('details.location')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('table.country')}
                </p>
                <p className="text-base">{warehouse.country}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('table.city')}
                </p>
                <p className="text-base">{warehouse.city || '-'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('form.address')}
                </p>
                <p className="text-base whitespace-pre-line">{warehouse.address || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <BarChart className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('details.properties')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('table.currency')}
                </p>
                <p className="text-base">
                  {warehouseCurrency.code} - {warehouseCurrency.name} ({warehouseCurrency.symbol})
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('table.capacity')}
                </p>
                <p className="text-base">
                  {warehouse.capacity
                    ? `${warehouse.capacity} ${warehouse.capacityUnit || 'items'}`
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('details.currencySettings')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('details.conversionStatus')}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`${
                      warehouse.currencyConversion.enabled
                        ? 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    {warehouse.currencyConversion.enabled
                      ? t('details.enabled')
                      : t('details.disabled')}
                  </Badge>
                </div>
              </div>
              
              {warehouse.currencyConversion.enabled && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('form.targetCurrency')}
                    </p>
                    <p className="text-base">
                      {targetCurrency.code} - {targetCurrency.name} ({targetCurrency.symbol})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('form.conversionRate')}
                    </p>
                    <p className="text-base">
                      1 {warehouseCurrency.code} = {warehouse.currencyConversion.rate} {targetCurrency.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('form.autoUpdateRate')}
                    </p>
                    <p className="text-base">
                      {warehouse.currencyConversion.autoUpdate
                        ? t('details.enabled')
                        : t('details.disabled')}
                    </p>
                  </div>
                  {warehouse.currencyConversion.lastUpdated && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('details.lastUpdated')}
                      </p>
                      <p className="text-base">
                        {format(new Date(warehouse.currencyConversion.lastUpdated), 'PPP p')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <WarehouseSettings
              warehouseCurrency={warehouse.currency}
              currentSettings={{
                enabled: warehouse.currencyConversion.enabled,
                targetCurrency: warehouse.currencyConversion.targetCurrency,
                rate: warehouse.currencyConversion.rate,
                autoUpdate: warehouse.currencyConversion.autoUpdate,
              }}
              onUpdate={handleCurrencySettingsUpdate}
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
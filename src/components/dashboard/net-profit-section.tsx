'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  TrendingUp,
  TrendingDown,
  Truck,
  CheckCircle,
  Building2,
  Warehouse as WarehouseIcon,
  Ship,
  Settings,
  RotateCcw,
  Receipt,
  DollarSign,
  MinusCircle
} from 'lucide-react';
import {
  getWarehousesForNetProfit,
  getSellersForNetProfit,
  getNetProfitData,
  NetProfitFilters,
  NetProfitData,
  DateRangeFilter
} from '@/app/actions/dashboard';

interface Warehouse {
  _id: string;
  name: string;
  currency: string;
  country: string;
}

interface Seller {
  _id: string;
  name: string;
  email: string;
}

interface NetProfitSectionProps {
  showSellerFilter?: boolean; // true for admin, false for seller
}

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
];

export const NetProfitSection = ({ showSellerFilter = false }: NetProfitSectionProps) => {
  const t = useTranslations('dashboard.netProfit');

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [data, setData] = useState<NetProfitData | null>(null);

  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<string>('this_month');

  // Fetch warehouses on mount
  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Fetch sellers when warehouse changes (admin only)
  useEffect(() => {
    if (showSellerFilter && selectedWarehouse) {
      fetchSellers(selectedWarehouse);
    }
  }, [selectedWarehouse, showSellerFilter]);

  // Fetch data when filters change
  useEffect(() => {
    if (selectedWarehouse) {
      fetchData();
    }
  }, [selectedWarehouse, selectedSeller, datePreset]);

  const fetchWarehouses = async () => {
    setIsLoadingWarehouses(true);
    try {
      const response = await getWarehousesForNetProfit();
      if (response.success && response.warehouses) {
        setWarehouses(response.warehouses);
        // Auto-select first warehouse
        if (response.warehouses.length > 0) {
          setSelectedWarehouse(response.warehouses[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  const fetchSellers = async (warehouseId: string) => {
    setIsLoadingSellers(true);
    try {
      const response = await getSellersForNetProfit(warehouseId);
      if (response.success && response.sellers) {
        setSellers(response.sellers);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setIsLoadingSellers(false);
    }
  };

  const fetchData = async () => {
    if (!selectedWarehouse) return;

    setIsLoadingData(true);
    try {
      const filters: NetProfitFilters = {
        warehouseId: selectedWarehouse,
        sellerId: selectedSeller === 'all' ? undefined : selectedSeller,
        dateRange: { preset: datePreset as DateRangeFilter['preset'] }
      };

      const response = await getNetProfitData(filters);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching net profit data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ' + currency;
  };

  const selectedWarehouseData = warehouses.find(w => w._id === selectedWarehouse);
  const currency = data?.currency || selectedWarehouseData?.currency || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Warehouse Select */}
        <div className="w-full sm:w-auto">
          <Select
            value={selectedWarehouse}
            onValueChange={setSelectedWarehouse}
            disabled={isLoadingWarehouses}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder={t('selectWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse._id} value={warehouse._id}>
                  {warehouse.name} ({warehouse.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seller Select (Admin only) */}
        {showSellerFilter && (
          <div className="w-full sm:w-auto">
            <Select
              value={selectedSeller}
              onValueChange={setSelectedSeller}
              disabled={isLoadingSellers || !selectedWarehouse}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder={t('allSellers')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allSellers')}</SelectItem>
                {sellers.map((seller) => (
                  <SelectItem key={seller._id} value={seller._id}>
                    {seller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range Select */}
        <div className="w-full sm:w-auto">
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('selectPeriod')} />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {t(`periods.${preset.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Net Profit Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('cardTitle')}
          </CardTitle>
          <CardDescription>
            {selectedWarehouseData
              ? `${selectedWarehouseData.name} - ${selectedWarehouseData.country}`
              : t('selectWarehousePrompt')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData || isLoadingWarehouses ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !selectedWarehouse ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('selectWarehousePrompt')}
            </div>
          ) : !data ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noData')}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalOrders')}</p>
                    <p className="text-xl font-semibold">{data.totalOrders}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Receipt className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalInvoices')}</p>
                    <p className="text-xl font-semibold">{data.totalInvoices}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalRevenue')}</p>
                    <p className="text-xl font-semibold text-green-600">
                      +{formatCurrency(data.totalRevenue, currency)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Expenses Breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <MinusCircle className="h-4 w-4 text-red-500" />
                  {t('expenses')}
                </h4>
                <div className="space-y-3">
                  {data.expeditionCosts > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('expeditionCosts')}</span>
                      </div>
                      <span className="text-sm text-red-600">-{formatCurrency(data.expeditionCosts, currency)}</span>
                    </div>
                  )}

                  {data.confirmationFee > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('confirmationFee')}</span>
                      </div>
                      <span className="text-sm text-red-600">-{formatCurrency(data.confirmationFee, currency)}</span>
                    </div>
                  )}

                  {data.serviceFee > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('serviceFee')}</span>
                      </div>
                      <span className="text-sm text-red-600">-{formatCurrency(data.serviceFee, currency)}</span>
                    </div>
                  )}

                  {data.warehouseFee > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('warehouseFee')}</span>
                      </div>
                      <span className="text-sm text-red-600">-{formatCurrency(data.warehouseFee, currency)}</span>
                    </div>
                  )}

                  {data.shippingFee > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('shippingFee')}</span>
                      </div>
                      <span className="text-sm text-red-600">-{formatCurrency(data.shippingFee, currency)}</span>
                    </div>
                  )}

                  {data.processingFee > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('processingFee')}</span>
                      </div>
                      <span className="text-sm text-red-600">-{formatCurrency(data.processingFee, currency)}</span>
                    </div>
                  )}

                  {data.expeditionFee > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('expeditionFee')}</span>
                      </div>
                      <span className="text-sm text-red-600">-{formatCurrency(data.expeditionFee, currency)}</span>
                    </div>
                  )}

                  {data.refundAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('refunds')}</span>
                      </div>
                      <span className="text-sm text-red-600">-{formatCurrency(data.refundAmount, currency)}</span>
                    </div>
                  )}

                  {/* Custom Fees */}
                  {data.customFees.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <p className="text-xs text-muted-foreground font-medium">{t('customFees')}</p>
                      {data.customFees.map((fee, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{fee.name}</span>
                          </div>
                          <span className="text-sm text-red-600">-{formatCurrency(fee.amount, currency)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Total Expenses */}
              <div className="flex items-center justify-between">
                <span className="font-medium">{t('totalExpenses')}</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(data.totalExpenses, currency)}
                </span>
              </div>

              <Separator className="border-2" />

              {/* Net Profit */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {data.netProfit >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                  <span className="text-lg font-bold">{t('netProfit')}</span>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.netProfit >= 0 ? '+' : ''}{formatCurrency(data.netProfit, currency)}
                  </span>
                  {data.netProfit < 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {t('loss')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { OrderStatusPieChart, OrderStatusBarChart } from './order-status-chart';
import { CallCenterFiltersComponent } from './call-center-filters';
import { getProductsByWarehouse, getOrderStatusData, CallCenterFilters as CallCenterFiltersType } from '@/app/actions/dashboard';

interface Product {
  _id: string;
  name: string;
  code: string;
}

interface OrderStatusChartData {
  status: string;
  count: number;
  percentage: number;
}

export const OrderStatusSection = () => {
  const t = useTranslations('dashboard.seller.overview.orderStatus');
  const [products, setProducts] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<OrderStatusChartData[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [filters, setFilters] = useState<CallCenterFiltersType>({
    dateRange: { preset: 'this_year' }
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [filters]);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await getProductsByWarehouse();
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error(t('errorFetching'), error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchChartData = async () => {
    setIsLoadingCharts(true);
    try {
      const response = await getOrderStatusData(filters);
      if (response.success) {
        setChartData(response.data?.chartData || []);
        setTotalOrders(response.data?.totalOrders || 0);
      }
    } catch (error) {
      console.error(t('errorChart'), error);
    } finally {
      setIsLoadingCharts(false);
    }
  };

  const handleFiltersChange = (newFilters: CallCenterFiltersType) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <CallCenterFiltersComponent
        products={products}
        isLoadingProducts={isLoadingProducts}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderStatusPieChart
          data={chartData}
          totalOrders={totalOrders}
          isLoading={isLoadingCharts}
        />
        <OrderStatusBarChart
          data={chartData}
          totalOrders={totalOrders}
          isLoading={isLoadingCharts}
        />
      </div>
    </div>
  );
};
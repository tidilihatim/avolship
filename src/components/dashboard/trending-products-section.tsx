'use client';

import React, { useState, useEffect } from 'react';
import { TrendingProductsChart } from './trending-products-chart';
import { CallCenterFiltersComponent } from './call-center-filters';
import { getProductsByWarehouse, getTrendingProductsData, CallCenterFilters as CallCenterFiltersType, TrendingProductData } from '@/app/actions/dashboard';

interface Product {
  _id: string;
  name: string;
  code: string;
}

export const TrendingProductsSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<TrendingProductData[]>([]);
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
      console.error('Error fetching products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchChartData = async () => {
    setIsLoadingCharts(true);
    try {
      const response = await getTrendingProductsData(filters);
      if (response.success) {
        setChartData(response.data?.chartData || []);
        setTotalOrders(response.data?.totalOrders || 0);
      }
    } catch (error) {
      console.error('Error fetching trending products data:', error);
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
        <h2 className="text-2xl font-semibold tracking-tight">Trending Products</h2>
        <p className="text-sm text-muted-foreground">
          Most popular products based on order frequency
        </p>
      </div>

      <CallCenterFiltersComponent
        products={products}
        isLoadingProducts={isLoadingProducts}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <div className="grid grid-cols-1">
        <TrendingProductsChart
          data={chartData}
          totalOrders={totalOrders}
          isLoading={isLoadingCharts}
        />
      </div>
    </div>
  );
};
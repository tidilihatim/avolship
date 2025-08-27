'use server';

import { cookies } from 'next/headers';
import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import mongoose from 'mongoose';
import { UserRole } from '@/lib/db/models/user';
import Product from '@/lib/db/models/product';
import Order from '@/lib/db/models/order';

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
  preset?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';
}

export interface CallCenterFilters {
  productId?: string;
  warehouseId?: string;
  dateRange: DateRangeFilter;
}

export type CallStatus = 'answered' | 'unreached' | 'busy' | 'invalid';

export interface CallCenterChartData {
  status: CallStatus;
  count: number;
  percentage: number;
}

export interface DashboardResponse {
  success: boolean;
  message?: string;
  data?: any;
}

const getDateRange = (preset: string): { from: Date; to: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        from: yesterday,
        to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'this_week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return {
        from: weekStart,
        to: new Date(now.getTime())
      };
    
    case 'this_month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: monthStart,
        to: new Date(now.getTime())
      };
    
    case 'this_year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return {
        from: yearStart,
        to: new Date(now.getTime())
      };
    
    default:
      return {
        from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(now.getTime())
      };
  }
};


export const getProductsByWarehouse = withDbConnection(async (): Promise<DashboardResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    const cookiesStore = await cookies();
    const selectedWarehouseId = cookiesStore.get('selectedWarehouse')?.value;

    const query: any = {};
    
    if (user.role === UserRole.SELLER) {
      query.sellerId = user._id;
    }

    if (selectedWarehouseId) {
      query['warehouses.warehouseId'] = selectedWarehouseId;
    }

    const products = await Product.find(query)
      .select('_id name code')
      .lean();

    const serializedProducts = products.map((product: any) => ({
      _id: product._id.toString(),
      name: product.name,
      code: product.code
    }));

    return {
      success: true,
      data: serializedProducts
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch products'
    };
  }
});

export const getCallCenterConfirmationData = withDbConnection(async (filters: CallCenterFilters): Promise<DashboardResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    const cookiesStore = await cookies();
    const selectedWarehouseId = cookiesStore.get('selectedWarehouse')?.value;

    const baseQuery: any = {};
    if (user.role === UserRole.SELLER) {
      baseQuery.sellerId = new mongoose.Types.ObjectId(user._id);
    }
    if (selectedWarehouseId) {
      baseQuery.warehouseId = new mongoose.Types.ObjectId(selectedWarehouseId);
    }
    if (filters.productId) {
      baseQuery['products.productId'] = filters.productId;
    }

    // Add date range filtering
    if (filters.dateRange.preset || (filters.dateRange.from && filters.dateRange.to)) {
      const dateRange = filters.dateRange.preset 
        ? getDateRange(filters.dateRange.preset)
        : { from: filters.dateRange.from!, to: filters.dateRange.to! };
      
      baseQuery.orderDate = {
        $gte: dateRange.from,
        $lte: dateRange.to
      };
    }

    // Only include orders that have call attempts for this chart
    baseQuery.callAttempts = { $exists: true, $ne: [] };

    const callStatusCounts = await Order.aggregate([
      { $match: baseQuery },
      { $unwind: { path: '$callAttempts', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$callAttempts.status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);


    const totalCallAttempts = callStatusCounts.reduce((sum, item) => sum + item.count, 0);

    const chartData: CallCenterChartData[] = callStatusCounts.map(item => ({
      status: item._id as CallStatus,
      count: item.count,
      percentage: totalCallAttempts > 0 ? Math.round((item.count / totalCallAttempts) * 100) : 0
    }));

    if (totalCallAttempts === 0) {
      return {
        success: true,
        data: {
          chartData: [],
          totalOrders: 0
        }
      };
    }

    return {
      success: true,
      data: {
        chartData,
        totalOrders: totalCallAttempts
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch call center data'
    };
  }
});

export interface TrendingProductData {
  productName: string;
  productCode: string;
  orderCount: number;
  percentage: number;
}

export const getTrendingProductsData = withDbConnection(async (filters: CallCenterFilters): Promise<DashboardResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    const cookiesStore = await cookies();
    const selectedWarehouseId = cookiesStore.get('selectedWarehouse')?.value;

    const matchQuery: any = {};
    
    if (user.role === UserRole.SELLER) {
      matchQuery.sellerId = new mongoose.Types.ObjectId(user._id);
    }

    if (selectedWarehouseId) {
      matchQuery.warehouseId = new mongoose.Types.ObjectId(selectedWarehouseId);
    }

    // Add date range filtering
    if (filters.dateRange.preset || (filters.dateRange.from && filters.dateRange.to)) {
      const dateRange = filters.dateRange.preset 
        ? getDateRange(filters.dateRange.preset)
        : { from: filters.dateRange.from!, to: filters.dateRange.to! };
      
      matchQuery.orderDate = {
        $gte: dateRange.from,
        $lte: dateRange.to
      };
    }

    const trendingProducts = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$products.productId',
          productName: { $first: '$productDetails.name' },
          productCode: { $first: '$productDetails.code' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { orderCount: -1 }
      },
      {
        $limit: 10 // Top 10 trending products
      }
    ]);

    const totalOrdersCount = trendingProducts.reduce((sum, item) => sum + item.orderCount, 0);

    const chartData: TrendingProductData[] = trendingProducts.map(item => ({
      productName: item.productName,
      productCode: item.productCode,
      orderCount: item.orderCount,
      percentage: totalOrdersCount > 0 ? Math.round((item.orderCount / totalOrdersCount) * 100) : 0
    }));

    return {
      success: true,
      data: {
        chartData,
        totalOrders: totalOrdersCount
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch trending products data'
    };
  }
});

export const getOrderStatusData = withDbConnection(async (filters: CallCenterFilters): Promise<DashboardResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    const cookiesStore = await cookies();
    const selectedWarehouseId = cookiesStore.get('selectedWarehouse')?.value;

    const query: any = {};
    
    if (user.role === UserRole.SELLER) {
      query.sellerId = new mongoose.Types.ObjectId(user._id);
    }

    if (selectedWarehouseId) {
      query.warehouseId = new mongoose.Types.ObjectId(selectedWarehouseId);
    }

    if (filters.productId) {
      query['products.productId'] = filters.productId;
    }

    // Add date range filtering
    let dateRange = null;
    if (filters.dateRange.preset || (filters.dateRange.from && filters.dateRange.to)) {
      dateRange = filters.dateRange.preset 
        ? getDateRange(filters.dateRange.preset)
        : { from: filters.dateRange.from!, to: filters.dateRange.to! };
      
      query.orderDate = {
        $gte: dateRange.from,
        $lte: dateRange.to
      };
    }
    

    const orderStatusCounts = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalOrders = orderStatusCounts.reduce((sum, item) => sum + item.count, 0);

    const chartData: any[] = orderStatusCounts.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
    }));

    return {
      success: true,
      data: {
        chartData,
        totalOrders
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch order status data'
    };
  }
});
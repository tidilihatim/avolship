'use server';

import { cookies } from 'next/headers';
import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import mongoose from 'mongoose';
import { UserRole } from '@/lib/db/models/user';
import Product from '@/lib/db/models/product';
import Order, { OrderStatus } from '@/lib/db/models/order';
import Invoice from '@/lib/db/models/invoice';
import Warehouse from '@/lib/db/models/warehouse';
import User from '@/lib/db/models/user';

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

// Net Profit Interfaces
export interface NetProfitFilters {
  warehouseId: string;
  sellerId?: string; // Only for admin
  dateRange: DateRangeFilter;
}

export interface CustomFeeData {
  name: string;
  amount: number;
}

export interface NetProfitData {
  // Counts
  totalOrders: number;
  totalInvoices: number;

  // Revenue
  totalRevenue: number;

  // Expenses breakdown
  expeditionCosts: number;
  confirmationFee: number;
  serviceFee: number;
  warehouseFee: number;
  shippingFee: number;
  processingFee: number;
  expeditionFee: number;
  refundAmount: number;
  customFees: CustomFeeData[];
  totalCustomFees: number;

  // Totals
  totalExpenses: number;
  netProfit: number;

  // Currency
  currency: string;
}

export interface NetProfitResponse {
  success: boolean;
  message?: string;
  data?: NetProfitData;
  warehouses?: { _id: string; name: string; currency: string; country: string }[];
  sellers?: { _id: string; name: string; email: string }[];
}

/**
 * Get warehouses for net profit filter
 * For sellers: only their assigned warehouses
 * For admin: all warehouses
 */
export const getWarehousesForNetProfit = withDbConnection(async (): Promise<NetProfitResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    let warehouses: any[];

    if (user.role === UserRole.SELLER) {
      // Get warehouses assigned to this seller or available to all
      warehouses = await Warehouse.find({
        $or: [
          { isAvailableToAll: true },
          { assignedSellers: user._id }
        ],
        isActive: true
      }).select('_id name currency country').lean();
    } else if ([UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      // Admin can see all warehouses
      warehouses = await Warehouse.find({ isActive: true })
        .select('_id name currency country').lean();
    } else {
      return { success: false, message: 'Insufficient permissions' };
    }

    const serializedWarehouses = warehouses.map((w: any) => ({
      _id: w._id.toString(),
      name: w.name,
      currency: w.currency,
      country: w.country
    }));

    return { success: true, warehouses: serializedWarehouses };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to fetch warehouses' };
  }
});

/**
 * Get sellers for net profit filter (admin only)
 */
export const getSellersForNetProfit = withDbConnection(async (warehouseId?: string): Promise<NetProfitResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    let sellerQuery: any = { role: UserRole.SELLER };

    // If warehouse is specified, get sellers who have invoices in that warehouse
    if (warehouseId) {
      const sellerIds = await Invoice.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId)
      });
      sellerQuery._id = { $in: sellerIds };
    }

    const sellers = await User.find(sellerQuery)
      .select('_id name email')
      .sort({ name: 1 })
      .lean();

    const serializedSellers = sellers.map((s: any) => ({
      _id: s._id.toString(),
      name: s.name,
      email: s.email
    }));

    return { success: true, sellers: serializedSellers };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to fetch sellers' };
  }
});

/**
 * Get net profit data
 * Calculates from invoices (invoiced orders) and processed orders
 */
export const getNetProfitData = withDbConnection(async (filters: NetProfitFilters): Promise<NetProfitResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    // Validate warehouse
    if (!filters.warehouseId) {
      return { success: false, message: 'Warehouse is required' };
    }

    // Get warehouse for currency
    const warehouse = await Warehouse.findById(filters.warehouseId).select('currency').lean();
    if (!warehouse) {
      return { success: false, message: 'Warehouse not found' };
    }

    // Determine seller ID
    let sellerId: mongoose.Types.ObjectId | undefined;

    if (user.role === UserRole.SELLER) {
      sellerId = user._id as mongoose.Types.ObjectId;
    } else if ([UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      if (filters.sellerId && filters.sellerId !== 'all' && mongoose.Types.ObjectId.isValid(filters.sellerId)) {
        sellerId = new mongoose.Types.ObjectId(filters.sellerId);
      }
      // If no sellerId for admin, aggregate all sellers for this warehouse
    } else {
      return { success: false, message: 'Insufficient permissions' };
    }

    // Build date range
    let dateRange = { from: new Date(0), to: new Date() };
    if (filters.dateRange.preset) {
      dateRange = getDateRange(filters.dateRange.preset);
    } else if (filters.dateRange.from && filters.dateRange.to) {
      dateRange = { from: new Date(filters.dateRange.from), to: new Date(filters.dateRange.to) };
    }

    // Build invoice query
    const invoiceQuery: any = {
      warehouseId: new mongoose.Types.ObjectId(filters.warehouseId),
      periodEnd: { $gte: dateRange.from, $lte: dateRange.to }
    };

    if (sellerId) {
      invoiceQuery.sellerId = sellerId;
    }

    // Get all invoices matching the filters
    const invoices = await Invoice.find(invoiceQuery).lean();

    // Also get processed orders that are not yet invoiced
    const invoicedOrderIds = invoices.flatMap((inv: any) => inv.orderIds || []);

    const processedOrderQuery: any = {
      warehouseId: new mongoose.Types.ObjectId(filters.warehouseId),
      status: OrderStatus.PROCESSED,
      _id: { $nin: invoicedOrderIds },
      createdAt: { $gte: dateRange.from, $lte: dateRange.to }
    };

    if (sellerId) {
      processedOrderQuery.sellerId = sellerId;
    }

    const processedOrders = await Order.find(processedOrderQuery).lean();

    // Calculate totals from invoices
    let totalRevenue = 0;
    let expeditionCosts = 0;
    let confirmationFee = 0;
    let serviceFee = 0;
    let warehouseFee = 0;
    let shippingFee = 0;
    let processingFee = 0;
    let expeditionFee = 0;
    let refundAmount = 0;
    let totalCustomFees = 0;
    const customFeesMap: Map<string, number> = new Map();
    let totalInvoicedOrders = 0;

    for (const invoice of invoices as any[]) {
      // Revenue from invoice summary
      totalRevenue += invoice.summary?.totalSales || invoice.summary?.grossSales || 0;

      // Expedition costs
      expeditionCosts += invoice.summary?.totalExpeditionCosts || 0;

      // Legacy fees
      confirmationFee += invoice.fees?.confirmationFee || 0;
      serviceFee += invoice.fees?.serviceFee || 0;
      warehouseFee += invoice.fees?.warehouseFee || 0;
      shippingFee += invoice.fees?.shippingFee || 0;
      processingFee += invoice.fees?.processingFee || 0;
      expeditionFee += invoice.fees?.expeditionFee || 0;

      // Refunds
      refundAmount += invoice.summary?.totalRefundAmount || 0;

      // Custom fees - aggregate by name
      if (invoice.fees?.customFees && Array.isArray(invoice.fees.customFees)) {
        for (const customFee of invoice.fees.customFees) {
          const currentAmount = customFeesMap.get(customFee.name) || 0;
          customFeesMap.set(customFee.name, currentAmount + customFee.amount);
          totalCustomFees += customFee.amount;
        }
      }

      // Order count
      totalInvoicedOrders += invoice.orderIds?.length || 0;
    }

    // Add revenue from processed orders (not yet invoiced)
    for (const order of processedOrders as any[]) {
      totalRevenue += order.finalTotalPrice || order.totalPrice || 0;
    }

    // Convert custom fees map to array
    const customFees: CustomFeeData[] = [];
    customFeesMap.forEach((amount, name) => {
      customFees.push({ name, amount });
    });

    // Calculate totals
    const totalExpenses =
      expeditionCosts +
      confirmationFee +
      serviceFee +
      warehouseFee +
      shippingFee +
      processingFee +
      expeditionFee +
      refundAmount +
      totalCustomFees;

    const netProfit = totalRevenue - totalExpenses;

    const data: NetProfitData = {
      totalOrders: totalInvoicedOrders + processedOrders.length,
      totalInvoices: invoices.length,
      totalRevenue,
      expeditionCosts,
      confirmationFee,
      serviceFee,
      warehouseFee,
      shippingFee,
      processingFee,
      expeditionFee,
      refundAmount,
      customFees,
      totalCustomFees,
      totalExpenses,
      netProfit,
      currency: (warehouse as any).currency
    };

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching net profit data:', error);
    return { success: false, message: error.message || 'Failed to fetch net profit data' };
  }
});
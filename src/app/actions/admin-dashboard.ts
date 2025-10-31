'use server';

import mongoose from 'mongoose';
import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import User, { UserRole, UserStatus } from '@/lib/db/models/user';
import Order, { OrderStatus } from '@/lib/db/models/order';
import Product from '@/lib/db/models/product';
import Warehouse from '@/lib/db/models/warehouse';
import DeliveryStats from '@/lib/db/models/delivery-stats';
import Expedition from '@/lib/db/models/expedition';
import DebtInvoice from '@/lib/db/models/invoice';

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalWarehouses: number;
  totalRevenue: number;
  pendingUsers: number;
  activeDeliveryPersonnel: number;
  todayOrders: number;
}

export interface UsersByRole {
  role: string;
  count: number;
  percentage: number;
}

export interface OrderStatusChart {
  status: string;
  count: number;
  percentage: number;
}

export interface RevenueChart {
  date: string;
  revenue: number;
  orders: number;
}

export interface TotalOrdersChart {
  date: string;
  orders: number;
}

export interface ConfirmedOrdersChart {
  date: string;
  orders: number;
}

export interface ConfirmationRateChart {
  date: string;
  rate: number;
  confirmedOrders: number;
  totalOrders: number;
}

export interface DeliveredOrdersChart {
  date: string;
  orders: number;
}

export interface DeliveryRateChart {
  date: string;
  rate: number;
  deliveredOrders: number;
  totalOrders: number;
}

export interface ReturnRateChart {
  date: string;
  rate: number;
  returnedOrders: number;
  deliveredOrders: number;
}

export interface TotalCashChart {
  date: string;
  cash: number;
  orders: number;
  currency?: string;
}

export interface PendingPayoutsData {
  totalOrders: number;
  totalAmount: number;
  currency?: string;
}

export interface ProcessedAmountData {
  totalOrders: number;
  totalAmount: number;
  currency?: string;
}

export interface ProcessedOrdersChart {
  date: string;
  orders: number;
}

export interface RefundedOrdersChart {
  date: string;
  orders: number;
}

export interface RefundRateChart {
  date: string;
  refundRate: number;
  refundedOrders: number;
  totalOrders: number;
}

export interface OpenDeliveryIssues {
  totalIssues: number;
  openCount: number;
  assignedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
}

export interface TopPerformers {
  userId: string;
  name: string;
  role: string;
  metric: number;
  metricLabel: string;
}

export interface AdminDashboardData {
  stats: AdminStats;
  usersByRole: UsersByRole[];
  orderStatusChart: OrderStatusChart[];
  revenueChart: RevenueChart[];
  topPerformers: TopPerformers[];
  recentActivity: any[];
}

const getDateRange = (preset: string): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'this_week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(now);
      weekEnd.setHours(23, 59, 59, 999); // End of current day
      return {
        start: weekStart,
        end: weekEnd
      };
    
    case 'this_month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: monthStart,
        end: now
      };
    
    case 'this_year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return {
        start: yearStart,
        end: now
      };
    
    default:
      // Default to this month
      const defaultMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: defaultMonthStart,
        end: now
      };
  }
};

export interface AdminFilters {
  dateRange: AdminDateRange;
  userRole?: string;
  orderStatus?: string;
  warehouseId?: string;
}

export const getAdminDashboardStats = withDbConnection(async (filters?: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: AdminStats;
}> => {
  try {
    const user = await getCurrentUser();
    
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build filter queries
    const userFilter: any = {};
    const orderFilter: any = {};
    const productFilter: any = {};

    if (filters?.userRole) {
      userFilter.role = filters.userRole;
    }

    if (filters?.orderStatus) {
      orderFilter.status = filters.orderStatus;
    }

    if (filters?.warehouseId) {
      orderFilter.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
      productFilter['warehouses.warehouseId'] = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Date range for orders
    if (filters?.dateRange) {
      let start: Date, end: Date;
      if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
        start = filters.dateRange.from;
        end = filters.dateRange.to;
      } else if (filters.dateRange.preset) {
        const range = getDateRange(filters.dateRange.preset);
        start = range.start;
        end = range.end;
      } else {
        const range = getDateRange('this_month');
        start = range.start;
        end = range.end;
      }
      orderFilter.orderDate = { $gte: start, $lte: end };
    }

    // Parallel queries for performance
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalWarehouses,
      pendingUsers,
      todayOrders,
      activeDeliveryPersonnel,
      revenueData
    ] = await Promise.all([
      User.countDocuments(userFilter),
      Order.countDocuments(orderFilter),
      Product.countDocuments(productFilter),
      Warehouse.countDocuments(),
      User.countDocuments({ status: UserStatus.PENDING, ...userFilter }),
      Order.countDocuments({
        orderDate: { $gte: today, $lt: tomorrow },
        ...orderFilter
      }),
      User.countDocuments({
        role: UserRole.DELIVERY,
        status: UserStatus.APPROVED,
        isAvailable: true
      }),
      Order.aggregate([
        {
          $match: {
            status: 'delivered',
            ...orderFilter
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalTotalPrice' }
          }
        }
      ])
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    const stats: AdminStats = {
      totalUsers,
      totalOrders,
      totalProducts,
      totalWarehouses,
      totalRevenue,
      pendingUsers,
      activeDeliveryPersonnel,
      todayOrders
    };

    return { success: true, data: stats };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch admin dashboard stats'
    };
  }
});

export const getUsersByRole = withDbConnection(async (filters?: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: UsersByRole[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Build match query based on filters
    const matchQuery: any = {};

    if (filters?.userRole) {
      matchQuery.role = filters.userRole;
    }

    if (filters?.warehouseId) {
      // For users associated with specific warehouses (sellers, etc.)
      // This might need adjustment based on your User model structure
      matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    const pipeline: any[] = [];
    
    if (Object.keys(matchQuery).length > 0) {
      pipeline.push({ $match: matchQuery });
    }

    pipeline.push(
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    );

    const usersByRole = await User.aggregate(pipeline);

    // Filter out SUPER_ADMIN role data unless current user is SUPER_ADMIN
    const filteredUsersByRole = user.role === UserRole.SUPER_ADMIN
      ? usersByRole
      : usersByRole.filter(item => item._id !== UserRole.SUPER_ADMIN);

    const filteredTotalUsers = filteredUsersByRole.reduce((sum, item) => sum + item.count, 0);

    const data: UsersByRole[] = filteredUsersByRole.map(item => ({
      role: item._id,
      count: item.count,
      percentage: filteredTotalUsers > 0 ? Math.round((item.count / filteredTotalUsers) * 100) : 0
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch users by role data'
    };
  }
});

export const getOrderStatusChart = withDbConnection(async (filters?: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: OrderStatusChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Build match query based on filters
    const matchQuery: any = {};

    if (filters?.orderStatus) {
      matchQuery.status = filters.orderStatus;
    }

    if (filters?.warehouseId) {
      matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Date range filtering
    if (filters?.dateRange) {
      let start: Date, end: Date;
      if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
        start = filters.dateRange.from;
        end = filters.dateRange.to;
      } else if (filters.dateRange.preset) {
        const range = getDateRange(filters.dateRange.preset);
        start = range.start;
        end = range.end;
      } else {
        const range = getDateRange('this_month');
        start = range.start;
        end = range.end;
      }
      matchQuery.orderDate = { $gte: start, $lte: end };
    }

    const pipeline: any[] = [];
    
    if (Object.keys(matchQuery).length > 0) {
      pipeline.push({ $match: matchQuery });
    }

    pipeline.push(
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    );

    const orderStatusCounts = await Order.aggregate(pipeline);

    const totalOrders = orderStatusCounts.reduce((sum, item) => sum + item.count, 0);

    const data: OrderStatusChart[] = orderStatusCounts.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch order status chart data'
    };
  }
});

export interface AdminDateRange {
  from?: Date;
  to?: Date;
  preset?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';
}

export const getRevenueChart = withDbConnection(async (filters: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: RevenueChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range based on filter
    let start: Date;
    let end: Date;
    let groupByFormat: string;
    let sortFormat: string;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = filters.dateRange.from;
      end = filters.dateRange.to;
      // Determine granularity based on date range
      const daysDiff = Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        groupByFormat = '%Y-%m-%d'; // Daily for week or less
        sortFormat = 'daily';
      } else if (daysDiff <= 365) {
        groupByFormat = '%Y-%U'; // Weekly for up to a year
        sortFormat = 'weekly';
      } else {
        groupByFormat = '%Y-%m'; // Monthly for more than a year
        sortFormat = 'monthly';
      }
    } else if (filters.dateRange.preset) {
      const range = getDateRange(filters.dateRange.preset);
      start = range.start;
      end = range.end;
      
      // Set granularity based on preset
      switch (filters.dateRange.preset) {
        case 'today':
        case 'yesterday':
          groupByFormat = '%Y-%m-%d-%H'; // Hourly
          sortFormat = 'hourly';
          break;
        case 'this_week':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_month':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_year':
          groupByFormat = '%Y-%m'; // Monthly
          sortFormat = 'monthly';
          break;
        default:
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
      }
    } else {
      // Default to this month
      const range = getDateRange('this_month');
      start = range.start;
      end = range.end;
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    }

    // Build match query with all filters
    const matchQuery: any = {
      orderDate: { $gte: start, $lte: end },
      status: { $in: ['delivered'] }, // Only count delivered orders for revenue
      finalTotalPrice: { $gt: 0 } // Only count orders with actual revenue
    };

    if (filters.warehouseId) {
      matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    const revenueData = await Order.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate'
            }
          },
          revenue: { $sum: '$finalTotalPrice' }, // Use finalTotalPrice (after discounts)
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create a complete date range with zero values for missing data
    const fillDateGaps = (data: any[], start: Date, end: Date, format: string) => {
      const result: RevenueChart[] = [];
      const dataMap = new Map(data.map(item => [item._id, item]));
      
      let current = new Date(start);
      const endDate = new Date(end);
      
      while (current <= endDate) {
        let key: string;
        let formattedDate: string;
        
        if (format === 'hourly') {
          key = current.toISOString().slice(0, 13).replace('T', '-'); // YYYY-MM-DD-HH
          const hour = current.getHours();
          formattedDate = `${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'weekly') {
          const year = current.getFullYear();
          const weekNum = getWeekNumber(current);
          key = `${year}-${weekNum.toString().padStart(2, '0')}`;
          formattedDate = `${year} W${weekNum}`;
          current.setDate(current.getDate() + 7);
        } else if (format === 'monthly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          key = `${year}-${month}`;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedDate = `${monthNames[current.getMonth()]} ${year}`;
          current.setMonth(current.getMonth() + 1);
        } else {
          // Daily
          key = current.toISOString().slice(0, 10); // YYYY-MM-DD
          formattedDate = key; // Will be formatted in frontend
          current.setDate(current.getDate() + 1);
        }
        
        const existingData = dataMap.get(key);
        result.push({
          date: formattedDate,
          revenue: existingData?.revenue || 0,
          orders: existingData?.orders || 0
        });
      }
      
      return result;
    };
    
    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Fill gaps in data to show complete timeline
    const completeData = fillDateGaps(revenueData, start, end, sortFormat);
    
    // Limit data points for better chart performance and readability
    const limitDataPoints = (data: RevenueChart[], maxPoints: number = 50) => {
      if (data.length <= maxPoints) return data;
      
      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, index) => index % step === 0);
    };
    
    const finalData = sortFormat === 'daily' && completeData.length > 31 
      ? limitDataPoints(completeData, 31) // Limit daily view to ~31 points
      : completeData;

    return { success: true, data: finalData };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch revenue chart data'
    };
  }
});

/**
 * Get total orders chart data
 * Counts all orders regardless of status
 * Shows order volume trends over time (hourly/daily/weekly/monthly)
 */
export const getTotalOrdersChart = withDbConnection(async (filters: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: TotalOrdersChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range based on filter
    let start: Date;
    let end: Date;
    let groupByFormat: string;
    let sortFormat: string;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = filters.dateRange.from;
      end = filters.dateRange.to;
      // Determine granularity based on date range
      const daysDiff = Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 31) {
        groupByFormat = '%Y-%m-%d'; // Daily for month or less
        sortFormat = 'daily';
      } else if (daysDiff <= 365) {
        groupByFormat = '%Y-%U'; // Weekly for up to a year
        sortFormat = 'weekly';
      } else {
        groupByFormat = '%Y-%m'; // Monthly for more than a year
        sortFormat = 'monthly';
      }
    } else if (filters.dateRange.preset) {
      const range = getDateRange(filters.dateRange.preset);
      start = range.start;
      end = range.end;

      // Set granularity based on preset
      switch (filters.dateRange.preset) {
        case 'today':
        case 'yesterday':
          groupByFormat = '%Y-%m-%d-%H'; // Hourly
          sortFormat = 'hourly';
          break;
        case 'this_week':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_month':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_year':
          groupByFormat = '%Y-%m'; // Monthly
          sortFormat = 'monthly';
          break;
        default:
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
      }
    } else {
      // Default to this month
      const range = getDateRange('this_month');
      start = range.start;
      end = range.end;
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    }

    // Get server timezone offset for consistent date handling
    const timezoneOffset = new Date().getTimezoneOffset(); // in minutes
    const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
    const timezone = `${timezoneSign}${timezoneHours.toString().padStart(2, '0')}:${timezoneMinutes.toString().padStart(2, '0')}`;

    // Build match query - NO STATUS FILTER (count all orders)
    const matchQuery: any = {
      orderDate: { $gte: start, $lte: end }
    };

    if (filters.warehouseId) {
      matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    const ordersData = await Order.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create a complete date range with zero values for missing data
    const fillDateGaps = (data: any[], start: Date, end: Date, format: string) => {
      const result: TotalOrdersChart[] = [];
      const dataMap = new Map(data.map(item => [item._id, item]));

      let current = new Date(start);
      const endDate = new Date(end);

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          const hour = current.getHours().toString().padStart(2, '0');
          key = `${year}-${month}-${day}-${hour}`; // YYYY-MM-DD-HH
          formattedDate = `${month}-${day} ${hour}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'weekly') {
          const year = current.getFullYear();
          const weekNum = getWeekNumber(current);
          key = `${year}-${weekNum.toString().padStart(2, '0')}`;
          formattedDate = `${year} W${weekNum}`;
          current.setDate(current.getDate() + 7);
        } else if (format === 'monthly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          key = `${year}-${month}`;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedDate = `${monthNames[current.getMonth()]} ${year}`;
          current.setMonth(current.getMonth() + 1);
        } else {
          // Daily - format in local time to avoid timezone shift
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          key = `${year}-${month}-${day}`; // YYYY-MM-DD
          formattedDate = key; // Will be formatted in frontend
          current.setDate(current.getDate() + 1);
        }

        const existingData = dataMap.get(key);
        result.push({
          date: formattedDate,
          orders: existingData?.orders || 0
        });
      }

      return result;
    };

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Fill gaps in data to show complete timeline
    const completeData = fillDateGaps(ordersData, start, end, sortFormat);

    // Limit data points for better chart performance and readability
    const limitDataPoints = (data: TotalOrdersChart[], maxPoints: number = 50) => {
      if (data.length <= maxPoints) return data;

      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, index) => index % step === 0);
    };

    const finalData = sortFormat === 'daily' && completeData.length > 31
      ? limitDataPoints(completeData, 31) // Limit daily view to ~31 points
      : completeData;

    return { success: true, data: finalData };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch total orders chart data'
    };
  }
});

/**
 * Get confirmed orders chart data
 * Counts only orders with status 'confirmed' (validated by call center)
 * Shows confirmed order volume trends over time (hourly/daily/weekly/monthly)
 */
export const getConfirmedOrdersChart = withDbConnection(async (filters: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: ConfirmedOrdersChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range based on filter
    let start: Date;
    let end: Date;
    let groupByFormat: string;
    let sortFormat: string;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = filters.dateRange.from;
      end = filters.dateRange.to;
      // Determine granularity based on date range
      const daysDiff = Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 31) {
        groupByFormat = '%Y-%m-%d'; // Daily for month or less
        sortFormat = 'daily';
      } else if (daysDiff <= 365) {
        groupByFormat = '%Y-%U'; // Weekly for up to a year
        sortFormat = 'weekly';
      } else {
        groupByFormat = '%Y-%m'; // Monthly for more than a year
        sortFormat = 'monthly';
      }
    } else if (filters.dateRange.preset) {
      const range = getDateRange(filters.dateRange.preset);
      start = range.start;
      end = range.end;

      // Set granularity based on preset
      switch (filters.dateRange.preset) {
        case 'today':
        case 'yesterday':
          groupByFormat = '%Y-%m-%d-%H'; // Hourly
          sortFormat = 'hourly';
          break;
        case 'this_week':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_month':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_year':
          groupByFormat = '%Y-%m'; // Monthly
          sortFormat = 'monthly';
          break;
        default:
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
      }
    } else {
      // Default to this month
      const range = getDateRange('this_month');
      start = range.start;
      end = range.end;
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    }

    // Get server timezone offset for consistent date handling
    const timezoneOffset = new Date().getTimezoneOffset(); // in minutes
    const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
    const timezone = `${timezoneSign}${timezoneHours.toString().padStart(2, '0')}:${timezoneMinutes.toString().padStart(2, '0')}`;

    // Build match query - FILTER FOR CONFIRMED STATUS ONLY
    const matchQuery: any = {
      orderDate: { $gte: start, $lte: end },
      status: 'confirmed' // Only confirmed orders
    };

    if (filters.warehouseId) {
      matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    const ordersData = await Order.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create a complete date range with zero values for missing data
    const fillDateGaps = (data: any[], start: Date, end: Date, format: string) => {
      const result: ConfirmedOrdersChart[] = [];
      const dataMap = new Map(data.map(item => [item._id, item]));

      let current = new Date(start);
      const endDate = new Date(end);

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          const hour = current.getHours().toString().padStart(2, '0');
          key = `${year}-${month}-${day}-${hour}`; // YYYY-MM-DD-HH
          formattedDate = `${month}-${day} ${hour}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'weekly') {
          const year = current.getFullYear();
          const weekNum = getWeekNumber(current);
          key = `${year}-${weekNum.toString().padStart(2, '0')}`;
          formattedDate = `${year} W${weekNum}`;
          current.setDate(current.getDate() + 7);
        } else if (format === 'monthly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          key = `${year}-${month}`;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedDate = `${monthNames[current.getMonth()]} ${year}`;
          current.setMonth(current.getMonth() + 1);
        } else {
          // Daily - format in local time to avoid timezone shift
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          key = `${year}-${month}-${day}`; // YYYY-MM-DD
          formattedDate = key; // Will be formatted in frontend
          current.setDate(current.getDate() + 1);
        }

        const existingData = dataMap.get(key);
        result.push({
          date: formattedDate,
          orders: existingData?.orders || 0
        });
      }

      return result;
    };

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Fill gaps in data to show complete timeline
    const completeData = fillDateGaps(ordersData, start, end, sortFormat);

    // Limit data points for better chart performance and readability
    const limitDataPoints = (data: ConfirmedOrdersChart[], maxPoints: number = 50) => {
      if (data.length <= maxPoints) return data;

      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, index) => index % step === 0);
    };

    const finalData = sortFormat === 'daily' && completeData.length > 31
      ? limitDataPoints(completeData, 31) // Limit daily view to ~31 points
      : completeData;

    return { success: true, data: finalData };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch confirmed orders chart data'
    };
  }
});

/**
 * Get confirmation rate chart data
 * Shows percentage of orders confirmed by call center
 * Rate = (Confirmed Orders / Total Orders) * 100
 */
export const getConfirmationRateChart = withDbConnection(async (filters: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: ConfirmationRateChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range based on filter
    let start: Date;
    let end: Date;
    let groupByFormat: string;
    let sortFormat: string;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = filters.dateRange.from;
      end = filters.dateRange.to;
      // Determine granularity based on date range
      const daysDiff = Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 31) {
        groupByFormat = '%Y-%m-%d'; // Daily for month or less
        sortFormat = 'daily';
      } else if (daysDiff <= 365) {
        groupByFormat = '%Y-%U'; // Weekly for up to a year
        sortFormat = 'weekly';
      } else {
        groupByFormat = '%Y-%m'; // Monthly for more than a year
        sortFormat = 'monthly';
      }
    } else if (filters.dateRange.preset) {
      const range = getDateRange(filters.dateRange.preset);
      start = range.start;
      end = range.end;

      // Set granularity based on preset
      switch (filters.dateRange.preset) {
        case 'today':
        case 'yesterday':
          groupByFormat = '%Y-%m-%d-%H'; // Hourly
          sortFormat = 'hourly';
          break;
        case 'this_week':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_month':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_year':
          groupByFormat = '%Y-%m'; // Monthly
          sortFormat = 'monthly';
          break;
        default:
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
      }
    } else {
      // Default to this month
      const range = getDateRange('this_month');
      start = range.start;
      end = range.end;
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    }

    // Get server timezone offset for consistent date handling
    const timezoneOffset = new Date().getTimezoneOffset(); // in minutes
    const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
    const timezone = `${timezoneSign}${timezoneHours.toString().padStart(2, '0')}:${timezoneMinutes.toString().padStart(2, '0')}`;

    // Build base match query
    const baseMatchQuery: any = {
      orderDate: { $gte: start, $lte: end }
    };

    if (filters.warehouseId) {
      baseMatchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Query all orders
    const allOrdersData = await Order.aggregate([
      {
        $match: baseMatchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Query confirmed orders only
    const confirmedOrdersData = await Order.aggregate([
      {
        $match: {
          ...baseMatchQuery,
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          confirmedOrders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create maps for easy lookup
    const allOrdersMap = new Map(allOrdersData.map(item => [item._id, item.totalOrders]));
    const confirmedOrdersMap = new Map(confirmedOrdersData.map(item => [item._id, item.confirmedOrders]));

    // Create a complete date range with zero values for missing data
    const fillDateGaps = (start: Date, end: Date, format: string) => {
      const result: ConfirmationRateChart[] = [];

      let current = new Date(start);
      const endDate = new Date(end);

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          const hour = current.getHours().toString().padStart(2, '0');
          key = `${year}-${month}-${day}-${hour}`; // YYYY-MM-DD-HH
          formattedDate = `${month}-${day} ${hour}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'weekly') {
          const year = current.getFullYear();
          const weekNum = getWeekNumber(current);
          key = `${year}-${weekNum.toString().padStart(2, '0')}`;
          formattedDate = `${year} W${weekNum}`;
          current.setDate(current.getDate() + 7);
        } else if (format === 'monthly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          key = `${year}-${month}`;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedDate = `${monthNames[current.getMonth()]} ${year}`;
          current.setMonth(current.getMonth() + 1);
        } else {
          // Daily - format in local time to avoid timezone shift
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          key = `${year}-${month}-${day}`; // YYYY-MM-DD
          formattedDate = key; // Will be formatted in frontend
          current.setDate(current.getDate() + 1);
        }

        const totalOrders = allOrdersMap.get(key) || 0;
        const confirmedOrders = confirmedOrdersMap.get(key) || 0;
        const rate = totalOrders > 0 ? Math.round((confirmedOrders / totalOrders) * 100) : 0;

        result.push({
          date: formattedDate,
          rate: rate,
          confirmedOrders: confirmedOrders,
          totalOrders: totalOrders
        });
      }

      return result;
    };

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Fill gaps in data to show complete timeline
    const completeData = fillDateGaps(start, end, sortFormat);

    // Limit data points for better chart performance and readability
    const limitDataPoints = (data: ConfirmationRateChart[], maxPoints: number = 50) => {
      if (data.length <= maxPoints) return data;

      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, index) => index % step === 0);
    };

    const finalData = sortFormat === 'daily' && completeData.length > 31
      ? limitDataPoints(completeData, 31) // Limit daily view to ~31 points
      : completeData;

    return { success: true, data: finalData };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch confirmation rate chart data'
    };
  }
});

/**
 * Get delivered orders chart data
 * Counts only orders with status 'delivered' (successfully completed)
 * Shows delivered order volume trends over time (hourly/daily/weekly/monthly)
 */
export const getDeliveredOrdersChart = withDbConnection(async (filters: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: DeliveredOrdersChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range based on filter
    let start: Date;
    let end: Date;
    let groupByFormat: string;
    let sortFormat: string;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = filters.dateRange.from;
      end = filters.dateRange.to;
      // Determine granularity based on date range
      const daysDiff = Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 31) {
        groupByFormat = '%Y-%m-%d'; // Daily for month or less
        sortFormat = 'daily';
      } else if (daysDiff <= 365) {
        groupByFormat = '%Y-%U'; // Weekly for up to a year
        sortFormat = 'weekly';
      } else {
        groupByFormat = '%Y-%m'; // Monthly for more than a year
        sortFormat = 'monthly';
      }
    } else if (filters.dateRange.preset) {
      const range = getDateRange(filters.dateRange.preset);
      start = range.start;
      end = range.end;

      // Set granularity based on preset
      switch (filters.dateRange.preset) {
        case 'today':
        case 'yesterday':
          groupByFormat = '%Y-%m-%d-%H'; // Hourly
          sortFormat = 'hourly';
          break;
        case 'this_week':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_month':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_year':
          groupByFormat = '%Y-%m'; // Monthly
          sortFormat = 'monthly';
          break;
        default:
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
      }
    } else {
      // Default to this month
      const range = getDateRange('this_month');
      start = range.start;
      end = range.end;
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    }

    // Get server timezone offset for consistent date handling
    const timezoneOffset = new Date().getTimezoneOffset(); // in minutes
    const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
    const timezone = `${timezoneSign}${timezoneHours.toString().padStart(2, '0')}:${timezoneMinutes.toString().padStart(2, '0')}`;

    // Build match query - FILTER FOR DELIVERED STATUS ONLY
    const matchQuery: any = {
      orderDate: { $gte: start, $lte: end },
      status: 'delivered' // Only delivered orders
    };

    if (filters.warehouseId) {
      matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    const ordersData = await Order.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create a complete date range with zero values for missing data
    const fillDateGaps = (data: any[], start: Date, end: Date, format: string) => {
      const result: DeliveredOrdersChart[] = [];
      const dataMap = new Map(data.map(item => [item._id, item]));

      let current = new Date(start);
      const endDate = new Date(end);

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          const hour = current.getHours().toString().padStart(2, '0');
          key = `${year}-${month}-${day}-${hour}`; // YYYY-MM-DD-HH
          formattedDate = `${month}-${day} ${hour}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'weekly') {
          const year = current.getFullYear();
          const weekNum = getWeekNumber(current);
          key = `${year}-${weekNum.toString().padStart(2, '0')}`;
          formattedDate = `${year} W${weekNum}`;
          current.setDate(current.getDate() + 7);
        } else if (format === 'monthly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          key = `${year}-${month}`;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedDate = `${monthNames[current.getMonth()]} ${year}`;
          current.setMonth(current.getMonth() + 1);
        } else {
          // Daily - format in local time to avoid timezone shift
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          key = `${year}-${month}-${day}`; // YYYY-MM-DD
          formattedDate = key; // Will be formatted in frontend
          current.setDate(current.getDate() + 1);
        }

        const existingData = dataMap.get(key);
        result.push({
          date: formattedDate,
          orders: existingData?.orders || 0
        });
      }

      return result;
    };

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Fill gaps in data to show complete timeline
    const completeData = fillDateGaps(ordersData, start, end, sortFormat);

    // Limit data points for better chart performance and readability
    const limitDataPoints = (data: DeliveredOrdersChart[], maxPoints: number = 50) => {
      if (data.length <= maxPoints) return data;

      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, index) => index % step === 0);
    };

    const finalData = sortFormat === 'daily' && completeData.length > 31
      ? limitDataPoints(completeData, 31) // Limit daily view to ~31 points
      : completeData;

    return { success: true, data: finalData };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch delivered orders chart data'
    };
  }
});

/**
 * Get delivery rate chart data (Delivered / Total Orders * 100)
 * Calculates the percentage of orders that were successfully delivered
 * Shows delivery success rate trends over time (hourly/daily/weekly/monthly)
 */
export const getDeliveryRateChart = withDbConnection(async (filters: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: DeliveryRateChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range based on filter
    let start: Date;
    let end: Date;
    let groupByFormat: string;
    let sortFormat: string;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = filters.dateRange.from;
      end = filters.dateRange.to;
      // Determine granularity based on date range
      const daysDiff = Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 31) {
        groupByFormat = '%Y-%m-%d'; // Daily for month or less
        sortFormat = 'daily';
      } else if (daysDiff <= 365) {
        groupByFormat = '%Y-%U'; // Weekly for up to a year
        sortFormat = 'weekly';
      } else {
        groupByFormat = '%Y-%m'; // Monthly for more than a year
        sortFormat = 'monthly';
      }
    } else if (filters.dateRange.preset) {
      const range = getDateRange(filters.dateRange.preset);
      start = range.start;
      end = range.end;

      // Set granularity based on preset
      switch (filters.dateRange.preset) {
        case 'today':
        case 'yesterday':
          groupByFormat = '%Y-%m-%d-%H'; // Hourly
          sortFormat = 'hourly';
          break;
        case 'this_week':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_month':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_year':
          groupByFormat = '%Y-%m'; // Monthly
          sortFormat = 'monthly';
          break;
        default:
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
      }
    } else {
      // Default to this month
      const range = getDateRange('this_month');
      start = range.start;
      end = range.end;
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    }

    // Get server timezone offset for consistent date handling
    const timezoneOffset = new Date().getTimezoneOffset(); // in minutes
    const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
    const timezone = `${timezoneSign}${timezoneHours.toString().padStart(2, '0')}:${timezoneMinutes.toString().padStart(2, '0')}`;

    // Build base match query
    const baseMatchQuery: any = {
      orderDate: { $gte: start, $lte: end }
    };

    if (filters.warehouseId) {
      baseMatchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Query all orders
    const allOrdersData = await Order.aggregate([
      {
        $match: baseMatchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Query delivered orders only
    const deliveredOrdersData = await Order.aggregate([
      {
        $match: {
          ...baseMatchQuery,
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          deliveredOrders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create maps for easy lookup
    const allOrdersMap = new Map(allOrdersData.map(item => [item._id, item.totalOrders]));
    const deliveredOrdersMap = new Map(deliveredOrdersData.map(item => [item._id, item.deliveredOrders]));

    // Create a complete date range with zero values for missing data
    const fillDateGaps = (start: Date, end: Date, format: string) => {
      const result: DeliveryRateChart[] = [];

      let current = new Date(start);
      const endDate = new Date(end);

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          const hour = current.getHours().toString().padStart(2, '0');
          key = `${year}-${month}-${day}-${hour}`; // YYYY-MM-DD-HH
          formattedDate = `${month}-${day} ${hour}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'weekly') {
          const year = current.getFullYear();
          const weekNum = getWeekNumber(current);
          key = `${year}-${weekNum.toString().padStart(2, '0')}`;
          formattedDate = `${year} W${weekNum}`;
          current.setDate(current.getDate() + 7);
        } else if (format === 'monthly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          key = `${year}-${month}`;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedDate = `${monthNames[current.getMonth()]} ${year}`;
          current.setMonth(current.getMonth() + 1);
        } else {
          // Daily - format in local time to avoid timezone shift
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          key = `${year}-${month}-${day}`; // YYYY-MM-DD
          formattedDate = key; // Will be formatted in frontend
          current.setDate(current.getDate() + 1);
        }

        const totalOrders = allOrdersMap.get(key) || 0;
        const deliveredOrders = deliveredOrdersMap.get(key) || 0;
        const rate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

        result.push({
          date: formattedDate,
          rate: rate,
          deliveredOrders: deliveredOrders,
          totalOrders: totalOrders
        });
      }

      return result;
    };

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Fill gaps in data to show complete timeline
    const completeData = fillDateGaps(start, end, sortFormat);

    // Limit data points for better chart performance and readability
    const limitDataPoints = (data: DeliveryRateChart[], maxPoints: number = 50) => {
      if (data.length <= maxPoints) return data;

      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, index) => index % step === 0);
    };

    const finalData = sortFormat === 'daily' && completeData.length > 31
      ? limitDataPoints(completeData, 31) // Limit daily view to ~31 points
      : completeData;

    return { success: true, data: finalData };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch delivery rate chart data'
    };
  }
});

/**
 * Get return rate chart data (Refunded / Delivered Orders * 100)
 * Calculates the percentage of delivered orders that were returned/refunded
 * Shows return rate trends over time (hourly/daily/weekly/monthly)
 */
export const getReturnRateChart = withDbConnection(async (filters: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: ReturnRateChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range based on filter
    let start: Date;
    let end: Date;
    let groupByFormat: string;
    let sortFormat: string;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = filters.dateRange.from;
      end = filters.dateRange.to;
      // Determine granularity based on date range
      const daysDiff = Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 31) {
        groupByFormat = '%Y-%m-%d'; // Daily for month or less
        sortFormat = 'daily';
      } else if (daysDiff <= 365) {
        groupByFormat = '%Y-%U'; // Weekly for up to a year
        sortFormat = 'weekly';
      } else {
        groupByFormat = '%Y-%m'; // Monthly for more than a year
        sortFormat = 'monthly';
      }
    } else if (filters.dateRange.preset) {
      const range = getDateRange(filters.dateRange.preset);
      start = range.start;
      end = range.end;

      // Set granularity based on preset
      switch (filters.dateRange.preset) {
        case 'today':
        case 'yesterday':
          groupByFormat = '%Y-%m-%d-%H'; // Hourly
          sortFormat = 'hourly';
          break;
        case 'this_week':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_month':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_year':
          groupByFormat = '%Y-%m'; // Monthly
          sortFormat = 'monthly';
          break;
        default:
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
      }
    } else {
      // Default to this month
      const range = getDateRange('this_month');
      start = range.start;
      end = range.end;
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    }

    // Get server timezone offset for consistent date handling
    const timezoneOffset = new Date().getTimezoneOffset(); // in minutes
    const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
    const timezone = `${timezoneSign}${timezoneHours.toString().padStart(2, '0')}:${timezoneMinutes.toString().padStart(2, '0')}`;

    // Build base match query
    const baseMatchQuery: any = {
      orderDate: { $gte: start, $lte: end }
    };

    if (filters.warehouseId) {
      baseMatchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Query delivered orders
    const deliveredOrdersData = await Order.aggregate([
      {
        $match: {
          ...baseMatchQuery,
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          deliveredOrders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Query refunded/returned orders only
    const returnedOrdersData = await Order.aggregate([
      {
        $match: {
          ...baseMatchQuery,
          status: 'refunded'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          returnedOrders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create maps for easy lookup
    const deliveredOrdersMap = new Map(deliveredOrdersData.map(item => [item._id, item.deliveredOrders]));
    const returnedOrdersMap = new Map(returnedOrdersData.map(item => [item._id, item.returnedOrders]));

    // Create a complete date range with zero values for missing data
    const fillDateGaps = (start: Date, end: Date, format: string) => {
      const result: ReturnRateChart[] = [];

      let current = new Date(start);
      const endDate = new Date(end);

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          const hour = current.getHours().toString().padStart(2, '0');
          key = `${year}-${month}-${day}-${hour}`; // YYYY-MM-DD-HH
          formattedDate = `${month}-${day} ${hour}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'weekly') {
          const year = current.getFullYear();
          const weekNum = getWeekNumber(current);
          key = `${year}-${weekNum.toString().padStart(2, '0')}`;
          formattedDate = `${year} W${weekNum}`;
          current.setDate(current.getDate() + 7);
        } else if (format === 'monthly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          key = `${year}-${month}`;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedDate = `${monthNames[current.getMonth()]} ${year}`;
          current.setMonth(current.getMonth() + 1);
        } else {
          // Daily - format in local time to avoid timezone shift
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          key = `${year}-${month}-${day}`; // YYYY-MM-DD
          formattedDate = key; // Will be formatted in frontend
          current.setDate(current.getDate() + 1);
        }

        const deliveredOrders = deliveredOrdersMap.get(key) || 0;
        const returnedOrders = returnedOrdersMap.get(key) || 0;
        const rate = deliveredOrders > 0 ? Math.round((returnedOrders / deliveredOrders) * 100) : 0;

        result.push({
          date: formattedDate,
          rate: rate,
          returnedOrders: returnedOrders,
          deliveredOrders: deliveredOrders
        });
      }

      return result;
    };

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Fill gaps in data to show complete timeline
    const completeData = fillDateGaps(start, end, sortFormat);

    // Limit data points for better chart performance and readability
    const limitDataPoints = (data: ReturnRateChart[], maxPoints: number = 50) => {
      if (data.length <= maxPoints) return data;

      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, index) => index % step === 0);
    };

    const finalData = sortFormat === 'daily' && completeData.length > 31
      ? limitDataPoints(completeData, 31) // Limit daily view to ~31 points
      : completeData;

    return { success: true, data: finalData };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch return rate chart data'
    };
  }
});

/**
 * Get total cash chart data from delivered orders
 * Calculates total cash received from delivered orders
 * Includes currency from warehouse for proper display
 * Shows cash flow trends over time (hourly/daily/weekly/monthly)
 */
export const getTotalCashChart = withDbConnection(async (filters: AdminFilters): Promise<{
  success: boolean;
  message?: string;
  data?: TotalCashChart[];
  currency?: string;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range based on filter
    let start: Date;
    let end: Date;
    let groupByFormat: string;
    let sortFormat: string;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = filters.dateRange.from;
      end = filters.dateRange.to;
      // Determine granularity based on date range
      const daysDiff = Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 31) {
        groupByFormat = '%Y-%m-%d'; // Daily for month or less
        sortFormat = 'daily';
      } else if (daysDiff <= 365) {
        groupByFormat = '%Y-%U'; // Weekly for up to a year
        sortFormat = 'weekly';
      } else {
        groupByFormat = '%Y-%m'; // Monthly for more than a year
        sortFormat = 'monthly';
      }
    } else if (filters.dateRange.preset) {
      const range = getDateRange(filters.dateRange.preset);
      start = range.start;
      end = range.end;

      // Set granularity based on preset
      switch (filters.dateRange.preset) {
        case 'today':
        case 'yesterday':
          groupByFormat = '%Y-%m-%d-%H'; // Hourly
          sortFormat = 'hourly';
          break;
        case 'this_week':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_month':
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
          break;
        case 'this_year':
          groupByFormat = '%Y-%m'; // Monthly
          sortFormat = 'monthly';
          break;
        default:
          groupByFormat = '%Y-%m-%d'; // Daily
          sortFormat = 'daily';
      }
    } else {
      // Default to this month
      const range = getDateRange('this_month');
      start = range.start;
      end = range.end;
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    }

    // Get server timezone offset for consistent date handling
    const timezoneOffset = new Date().getTimezoneOffset(); // in minutes
    const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
    const timezone = `${timezoneSign}${timezoneHours.toString().padStart(2, '0')}:${timezoneMinutes.toString().padStart(2, '0')}`;

    // Build base match query
    const matchQuery: any = {
      orderDate: { $gte: start, $lte: end },
      status: 'delivered' // Only delivered orders have cash
    };

    // If no warehouse filter is specified, return success with empty data and no currency
    // The chart component will handle displaying a friendly message
    if (!filters.warehouseId) {
      return {
        success: true,
        data: [],
        currency: undefined
      };
    }

    matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);

    // Get warehouse and its currency
    const warehouse = await Warehouse.findById(filters.warehouseId);
    if (!warehouse) {
      // Return empty data instead of error
      return {
        success: true,
        data: [],
        currency: undefined
      };
    }

    const currency = warehouse.currency;

    // Query delivered orders and aggregate cash by date
    const cashData = await Order.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          totalCash: {
            $sum: {
              $ifNull: ['$finalTotalPrice', '$totalPrice']
            }
          },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create a map for easy lookup
    const cashMap = new Map(cashData.map(item => [item._id, { cash: item.totalCash, orders: item.orderCount }]));

    // Create a complete date range with zero values for missing data
    const fillDateGaps = (start: Date, end: Date, format: string) => {
      const result: TotalCashChart[] = [];

      let current = new Date(start);
      const endDate = new Date(end);

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          const hour = current.getHours().toString().padStart(2, '0');
          key = `${year}-${month}-${day}-${hour}`; // YYYY-MM-DD-HH
          formattedDate = `${month}-${day} ${hour}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'weekly') {
          const year = current.getFullYear();
          const weekNum = getWeekNumber(current);
          key = `${year}-${weekNum.toString().padStart(2, '0')}`;
          formattedDate = `${year} W${weekNum}`;
          current.setDate(current.getDate() + 7);
        } else if (format === 'monthly') {
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          key = `${year}-${month}`;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedDate = `${monthNames[current.getMonth()]} ${year}`;
          current.setMonth(current.getMonth() + 1);
        } else {
          // Daily - format in local time to avoid timezone shift
          const year = current.getFullYear();
          const month = (current.getMonth() + 1).toString().padStart(2, '0');
          const day = current.getDate().toString().padStart(2, '0');
          key = `${year}-${month}-${day}`; // YYYY-MM-DD
          formattedDate = key; // Will be formatted in frontend
          current.setDate(current.getDate() + 1);
        }

        const data = cashMap.get(key) || { cash: 0, orders: 0 };

        result.push({
          date: formattedDate,
          cash: Math.round(data.cash * 100) / 100, // Round to 2 decimal places
          orders: data.orders,
          currency: currency
        });
      }

      return result;
    };

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Fill gaps in data to show complete timeline
    const completeData = fillDateGaps(start, end, sortFormat);

    // Limit data points for better chart performance and readability
    const limitDataPoints = (data: TotalCashChart[], maxPoints: number = 50) => {
      if (data.length <= maxPoints) return data;

      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, index) => index % step === 0);
    };

    const finalData = sortFormat === 'daily' && completeData.length > 31
      ? limitDataPoints(completeData, 31) // Limit daily view to ~31 points
      : completeData;

    return { success: true, data: finalData, currency };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch total cash chart data'
    };
  }
});

export const getTopPerformers = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: TopPerformers[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Get top delivery performers
    const topDeliveryPerformers = await DeliveryStats.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $group: {
          _id: '$userId',
          name: { $first: '$userDetails.name' },
          totalDeliveries: { $sum: '$totalDeliveries' }
        }
      },
      { $sort: { totalDeliveries: -1 } },
      { $limit: 5 }
    ]);

    // Get top sellers by orders
    const topSellers = await Order.aggregate([
      {
        $match: {
          sellerId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$sellerId',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$finalTotalPrice' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    const performers: TopPerformers[] = [
      ...topDeliveryPerformers.map(performer => ({
        userId: performer._id.toString(),
        name: performer.name,
        role: 'Delivery',
        metric: performer.totalDeliveries,
        metricLabel: 'Deliveries'
      })),
      ...topSellers.map(seller => ({
        userId: seller._id.toString(),
        name: seller.userDetails.name,
        role: 'Seller',
        metric: seller.totalRevenue,
        metricLabel: 'Revenue'
      }))
    ].slice(0, 10);

    return { success: true, data: performers };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch top performers data'
    };
  }
});

export const getRecentActivity = withDbConnection(async (limit: number = 10): Promise<{
  success: boolean;
  message?: string;
  data?: any[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role!== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Get recent orders - using embedded customer info
    const recentOrders = await Order.find()
      .populate('sellerId', 'name')
      .populate('warehouseId', 'name')
      .sort({ orderDate: -1 })
      .limit(limit)
      .select('_id orderId status totalPrice orderDate customer sellerId warehouseId deliveryTracking')
      .lean();

    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id name role status createdAt')
      .lean();

    // Combine and sort by date
    const activities = [
      ...recentOrders.map((order: any) => ({
        type: 'order',
        id: order._id.toString(),
        title: `New order #${order.orderId || order._id}`,
        description: `Order placed by ${order.customer?.name || 'Unknown Customer'}`,
        date: order.orderDate,
        status: order.status,
        amount: order.totalPrice,
        warehouse: order.warehouseId?.name,
        seller: order.sellerId?.name
      })),
      ...recentUsers.map((user: any) => ({
        type: 'user',
        id: user._id.toString(),
        title: `New ${user.role.toLowerCase()} registered`,
        description: `${user.name} joined the platform`,
        date: user.createdAt,
        status: user.status,
        role: user.role
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);

    return { success: true, data: activities };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch recent activity data'
    };
  }
});

export interface NormalSeller {
  sellerId: string;
  sellerName: string;
  totalDeliveredOrders: number;
  dailyAverage: number;
  periodDays: number;
}

export interface BestSeller {
  sellerId: string;
  sellerName: string;
  totalDeliveredOrders: number;
  dailyAverage: number;
  periodDays: number;
}

export interface EpicSeller {
  sellerId: string;
  sellerName: string;
  totalDeliveredOrders: number;
  dailyAverage: number;
  periodDays: number;
}

export type NormalSellersPeriod = 'weekly' | 'monthly' | 'yearly';
export type BestSellersPeriod = 'weekly' | 'monthly' | 'yearly';
export type EpicSellersPeriod = 'weekly' | 'monthly' | 'yearly';

/**
 * Get normal sellers (1-10 orders per day)
 * Counts all orders regardless of status
 * Performance optimized using aggregation pipeline
 */
export const getNormalSellersChart = withDbConnection(async (
  period: NormalSellersPeriod = 'monthly',
  filters?: AdminFilters
): Promise<{
  success: boolean;
  message?: string;
  data?: NormalSeller[];
}> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range from filters (same logic as other charts)
    let startDate: Date;
    let endDate: Date;
    let periodDays: number;

    if (filters?.dateRange) {
      // Use custom date range if provided
      if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
        startDate = filters.dateRange.from;
        endDate = filters.dateRange.to;
        periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      } else if (filters.dateRange.preset) {
        // Use preset-based range
        const range = getDateRange(filters.dateRange.preset);
        startDate = range.start;
        endDate = range.end;
        periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // Default fallback
        const range = getDateRange('this_month');
        startDate = range.start;
        endDate = range.end;
        periodDays = 30;
      }
    } else {
      // No filters provided, use period parameter
      const now = new Date();
      endDate = now;

      switch (period) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          periodDays = 7;
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodDays = 30;
          break;
        case 'yearly':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          periodDays = 365;
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodDays = 30;
      }
    }

    // Build match query
    const matchQuery: any = {
      orderDate: { $gte: startDate, $lte: endDate },
      sellerId: { $exists: true, $ne: null }
    };

    if (filters?.warehouseId) {
      matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Aggregation pipeline for performance
    const allSellersData = await Order.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$sellerId',
          totalDeliveredOrders: { $sum: 1 }
        }
      },
      {
        $addFields: {
          dailyAverage: {
            $divide: ['$totalDeliveredOrders', periodDays]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      {
        $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          sellerId: { $toString: '$_id' },
          sellerName: { $ifNull: ['$sellerInfo.name', 'Unknown Seller'] },
          sellerRole: { $ifNull: ['$sellerInfo.role', 'NO_ROLE'] },
          totalDeliveredOrders: 1,
          dailyAverage: { $round: ['$dailyAverage', 2] },
          periodDays: { $literal: periodDays }
        }
      },
      {
        $sort: { dailyAverage: -1 }
      }
    ]);

    // Filter for normal sellers (1-10 orders per day average)
    // For new systems with limited data, we show all sellers with any orders
    const sellersData = allSellersData.filter(seller => {
      const hasOrders = seller.totalDeliveredOrders > 0;
      const notSuperPerformer = seller.dailyAverage <= 10; // Exclude super high performers
      const isSeller = seller.sellerRole?.toUpperCase() === UserRole.SELLER || seller.sellerRole === 'seller';

      return hasOrders && notSuperPerformer && isSeller;
    }).slice(0, 50);

    const data: NormalSeller[] = sellersData.map(seller => ({
      sellerId: seller.sellerId,
      sellerName: seller.sellerName,
      totalDeliveredOrders: seller.totalDeliveredOrders,
      dailyAverage: seller.dailyAverage,
      periodDays: seller.periodDays
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch normal sellers data'
    };
  }
});

/**
 * Get best sellers (10-20 orders per day)
 * Counts all orders regardless of status
 * Performance optimized using aggregation pipeline
 */
export const getBestSellersChart = withDbConnection(async (
  period: BestSellersPeriod = 'monthly',
  filters?: AdminFilters
): Promise<{
  success: boolean;
  message?: string;
  data?: BestSeller[];
}> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range from filters (same logic as normal sellers)
    let startDate: Date;
    let endDate: Date;
    let periodDays: number;

    if (filters?.dateRange) {
      // Use custom date range if provided
      if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
        startDate = filters.dateRange.from;
        endDate = filters.dateRange.to;
        periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      } else if (filters.dateRange.preset) {
        // Use preset-based range
        const range = getDateRange(filters.dateRange.preset);
        startDate = range.start;
        endDate = range.end;
        periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // Default fallback
        const range = getDateRange('this_month');
        startDate = range.start;
        endDate = range.end;
        periodDays = 30;
      }
    } else {
      // No filters provided, use period parameter
      const now = new Date();
      endDate = now;

      switch (period) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          periodDays = 7;
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodDays = 30;
          break;
        case 'yearly':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          periodDays = 365;
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodDays = 30;
      }
    }

    // Build match query
    const matchQuery: any = {
      orderDate: { $gte: startDate, $lte: endDate },
      sellerId: { $exists: true, $ne: null }
    };

    if (filters?.warehouseId) {
      matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Aggregation pipeline for performance
    const allSellersData = await Order.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$sellerId',
          totalDeliveredOrders: { $sum: 1 }
        }
      },
      {
        $addFields: {
          dailyAverage: {
            $divide: ['$totalDeliveredOrders', periodDays]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      {
        $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          sellerId: { $toString: '$_id' },
          sellerName: { $ifNull: ['$sellerInfo.name', 'Unknown Seller'] },
          sellerRole: { $ifNull: ['$sellerInfo.role', 'NO_ROLE'] },
          totalDeliveredOrders: 1,
          dailyAverage: { $round: ['$dailyAverage', 2] },
          periodDays: { $literal: periodDays }
        }
      },
      {
        $sort: { dailyAverage: -1 }
      }
    ]);

    // Filter for best sellers (10-20 orders per day average)
    const sellersData = allSellersData.filter(seller => {
      const inBestRange = seller.dailyAverage >= 10 && seller.dailyAverage <= 20;
      const isSeller = seller.sellerRole?.toUpperCase() === UserRole.SELLER || seller.sellerRole === 'seller';

      return inBestRange && isSeller;
    }).slice(0, 50);

    const data: BestSeller[] = sellersData.map(seller => ({
      sellerId: seller.sellerId,
      sellerName: seller.sellerName,
      totalDeliveredOrders: seller.totalDeliveredOrders,
      dailyAverage: seller.dailyAverage,
      periodDays: seller.periodDays
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch best sellers data'
    };
  }
});

/**
 * Get epic sellers (>20 orders per day)
 * Counts all orders regardless of status
 * Performance optimized using aggregation pipeline
 */
export const getEpicSellersChart = withDbConnection(async (
  period: EpicSellersPeriod = 'monthly',
  filters?: AdminFilters
): Promise<{
  success: boolean;
  message?: string;
  data?: EpicSeller[];
}> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Calculate date range from filters (same logic as other sellers)
    let startDate: Date;
    let endDate: Date;
    let periodDays: number;

    if (filters?.dateRange) {
      // Use custom date range if provided
      if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
        startDate = filters.dateRange.from;
        endDate = filters.dateRange.to;
        periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      } else if (filters.dateRange.preset) {
        // Use preset-based range
        const range = getDateRange(filters.dateRange.preset);
        startDate = range.start;
        endDate = range.end;
        periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // Default fallback
        const range = getDateRange('this_month');
        startDate = range.start;
        endDate = range.end;
        periodDays = 30;
      }
    } else {
      // No filters provided, use period parameter
      const now = new Date();
      endDate = now;

      switch (period) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          periodDays = 7;
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodDays = 30;
          break;
        case 'yearly':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          periodDays = 365;
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodDays = 30;
      }
    }

    // Build match query
    const matchQuery: any = {
      orderDate: { $gte: startDate, $lte: endDate },
      sellerId: { $exists: true, $ne: null }
    };

    if (filters?.warehouseId) {
      matchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Aggregation pipeline for performance
    const allSellersData = await Order.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$sellerId',
          totalDeliveredOrders: { $sum: 1 }
        }
      },
      {
        $addFields: {
          dailyAverage: {
            $divide: ['$totalDeliveredOrders', periodDays]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      {
        $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          sellerId: { $toString: '$_id' },
          sellerName: { $ifNull: ['$sellerInfo.name', 'Unknown Seller'] },
          sellerRole: { $ifNull: ['$sellerInfo.role', 'NO_ROLE'] },
          totalDeliveredOrders: 1,
          dailyAverage: { $round: ['$dailyAverage', 2] },
          periodDays: { $literal: periodDays }
        }
      },
      {
        $sort: { dailyAverage: -1 }
      }
    ]);

    // Filter for epic sellers (>20 orders per day average)
    const sellersData = allSellersData.filter(seller => {
      const isEpic = seller.dailyAverage > 20;
      const isSeller = seller.sellerRole?.toUpperCase() === UserRole.SELLER || seller.sellerRole === 'seller';

      return isEpic && isSeller;
    }).slice(0, 50);

    const data: EpicSeller[] = sellersData.map(seller => ({
      sellerId: seller.sellerId,
      sellerName: seller.sellerName,
      totalDeliveredOrders: seller.totalDeliveredOrders,
      dailyAverage: seller.dailyAverage,
      periodDays: seller.periodDays
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch epic sellers data'
    };
  }
});

/**
 * Get Active Sellers for dropdown filters
 */
export const getActiveSellers = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  sellers?: Array<{ _id: string; name: string; businessName?: string }>;
}> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    const sellers = await User.find(
      {
        role: UserRole.SELLER,
        status: UserStatus.APPROVED
      },
      {
        _id: 1,
        name: 1,
        businessName: 1
      }
    ).sort({ name: 1 });

    return {
      success: true,
      sellers: sellers.map(seller => ({
        _id: seller._id.toString(),
        name: seller.name,
        businessName: seller.businessName
      }))
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch sellers'
    };
  }
});

/**
 * Get Pending Payouts Data
 * Shows orders that haven't been invoiced yet (amount yet to be paid to sellers)
 */
export const getPendingPayouts = withDbConnection(async (
  filters: AdminFilters,
  sellerId?: string // Optional seller filter specific to this chart
): Promise<{
  success: boolean;
  message?: string;
  data?: PendingPayoutsData;
}> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Require warehouse selection for currency
    if (!filters.warehouseId) {
      return {
        success: true,
        data: {
          totalOrders: 0,
          totalAmount: 0,
          currency: undefined
        }
      };
    }

    // Get warehouse and its currency
    const warehouse = await Warehouse.findById(filters.warehouseId);
    if (!warehouse) {
      return {
        success: true,
        data: {
          totalOrders: 0,
          totalAmount: 0,
          currency: undefined
        }
      };
    }

    const currency = warehouse.currency;

    // Calculate date range from filters
    const range = getDateRange(filters.dateRange.preset as any);
    let start: Date, end: Date;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = new Date(filters.dateRange.from);
      end = new Date(filters.dateRange.to);
    } else {
      start = range.start;
      end = range.end;
    }

    // Build match query for orders
    const orderMatchQuery: any = {
      orderDate: { $gte: start, $lte: end },
      status: 'delivered', // Only delivered orders need to be paid
      warehouseId: new mongoose.Types.ObjectId(filters.warehouseId)
    };

    // Add seller filter if provided
    if (sellerId) {
      orderMatchQuery.sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    // Get all invoices and extract orderIds that have been invoiced
    const invoices = await DebtInvoice.find({}, { orderIds: 1 });
    const invoicedOrderIds = invoices.flatMap(invoice =>
      invoice.orderIds.map((id:any) => id.toString())
    );

    // Get all delivered orders matching the criteria
    const allOrders = await Order.find(orderMatchQuery).select('_id finalTotalPrice totalPrice');

    // Filter out orders that have been invoiced
    const pendingOrders = allOrders.filter(order =>
      !invoicedOrderIds.includes(order._id.toString())
    );

    // Calculate total amount
    const totalAmount = pendingOrders.reduce((sum, order) => {
      const amount = order.finalTotalPrice ?? order.totalPrice ?? 0;
      return sum + amount;
    }, 0);

    return {
      success: true,
      data: {
        totalOrders: pendingOrders.length,
        totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
        currency
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch pending payouts data'
    };
  }
});

/**
 * Get Processed Amount Data
 * Shows total amount transferred to sellers (from invoices)
 */
export const getProcessedAmount = withDbConnection(async (
  filters: AdminFilters,
  sellerId?: string // Optional seller filter specific to this card
): Promise<{
  success: boolean;
  message?: string;
  data?: ProcessedAmountData;
}> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Require warehouse selection for currency
    if (!filters.warehouseId) {
      return {
        success: true,
        data: {
          totalOrders: 0,
          totalAmount: 0,
          currency: undefined
        }
      };
    }

    // Get warehouse and its currency
    const warehouse = await Warehouse.findById(filters.warehouseId);
    if (!warehouse) {
      return {
        success: true,
        data: {
          totalOrders: 0,
          totalAmount: 0,
          currency: undefined
        }
      };
    }

    const currency = warehouse.currency;

    // Calculate date range from filters
    const range = getDateRange(filters.dateRange.preset as any);
    let start: Date, end: Date;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = new Date(filters.dateRange.from);
      end = new Date(filters.dateRange.to);
    } else {
      start = range.start;
      end = range.end;
    }

    // Build match query for invoices
    // Check if invoice period overlaps with the filter date range
    const invoiceMatchQuery: any = {
      warehouseId: new mongoose.Types.ObjectId(filters.warehouseId),
      status: 'paid', // Only count paid invoices (money actually transferred)
      // Invoice period must overlap with filter range:
      // Invoice starts before filter ends AND invoice ends after filter starts
      periodStart: { $lte: end },
      periodEnd: { $gte: start }
    };

    // Add seller filter if provided
    if (sellerId) {
      invoiceMatchQuery.sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    console.log('Processed Amount Query:', {
      invoiceMatchQuery,
      dateRange: { start, end },
      warehouseId: filters.warehouseId,
      sellerId
    });

    // Get all invoices matching the criteria
    const invoices = await DebtInvoice.find(invoiceMatchQuery).select('orderIds summary.netPayment summary.totalSales summary.grossSales status periodStart periodEnd');

    console.log('Processed Amount Debug:', {
      invoiceCount: invoices.length,
      sampleInvoices: invoices.slice(0, 3).map(inv => ({
        status: inv.status,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        orderIdsLength: inv.orderIds?.length,
        netPayment: inv.summary?.netPayment,
        grossSales: inv.summary?.grossSales,
        totalSales: inv.summary?.totalSales
      }))
    });

    // Calculate total orders (count all orderIds from all invoices)
    const totalOrders = invoices.reduce((sum, invoice) => {
      return sum + (invoice.orderIds?.length || 0);
    }, 0);

    // Calculate total amount transferred (sum of totalSales - actual sales amount from invoices)
    // We use totalSales because that's the money that goes to sellers
    // netPayment can be negative if there are deductions/debts
    const totalAmount = invoices.reduce((sum, invoice) => {
      const salesAmount = invoice.summary?.totalSales || invoice.summary?.grossSales || 0;
      return sum + salesAmount;
    }, 0);

    console.log('Processed Amount Results:', { totalOrders, totalAmount, currency });

    return {
      success: true,
      data: {
        totalOrders,
        totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
        currency
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch processed amount data'
    };
  }
});

/**
 * Get Processed Orders Chart
 * Shows orders from paid invoices over time (daily/monthly/yearly)
 */
export const getProcessedOrdersChart = withDbConnection(async (
  filters: AdminFilters
): Promise<{
  success: boolean;
  message?: string;
  data?: ProcessedOrdersChart[];
}> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Determine grouping format based on preset
    let groupByFormat: string;
    let sortFormat: string;

    const range = getDateRange(filters.dateRange.preset as any);
    let start: Date, end: Date;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = new Date(filters.dateRange.from);
      end = new Date(filters.dateRange.to);
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    } else {
      switch (filters.dateRange.preset as any) {
        case 'today':
        case 'yesterday':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d %H:00';
          sortFormat = 'hourly';
          break;
        case 'this_week':
        case 'last7days':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d';
          sortFormat = 'daily';
          break;
        case 'this_month':
        case 'last30days':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-W%V';
          sortFormat = 'weekly';
          break;
        case 'this_year':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m';
          sortFormat = 'monthly';
          break;
        default:
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d';
          sortFormat = 'daily';
      }
    }

    // Get server timezone offset for consistent date handling
    const timezoneOffset = new Date().getTimezoneOffset();
    const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
    const timezone = `${timezoneSign}${timezoneHours.toString().padStart(2, '0')}:${timezoneMinutes.toString().padStart(2, '0')}`;

    // Build match query for paid invoices
    const invoiceMatchQuery: any = {
      status: 'paid',
      periodStart: { $lte: end },
      periodEnd: { $gte: start }
    };

    if (filters.warehouseId) {
      invoiceMatchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Get all paid invoices and extract orderIds
    const paidInvoices = await DebtInvoice.find(invoiceMatchQuery).select('orderIds');
    const processedOrderIds = paidInvoices.flatMap(invoice => invoice.orderIds || []);

    if (processedOrderIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get orders and group by date
    const ordersData = await Order.aggregate([
      {
        $match: {
          _id: { $in: processedOrderIds },
          orderDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Create a map for easy lookup
    const ordersMap = new Map(ordersData.map(item => [item._id, item.orderCount]));

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Fill in date gaps with zero values
    const fillDateGaps = (start: Date, end: Date, format: string) => {
      const result: ProcessedOrdersChart[] = [];
      let current = new Date(start);
      const endDate = new Date(end);

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const hour = current.getHours();
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          key = `${current.getFullYear()}-${month}-${day} ${String(hour).padStart(2, '0')}:00`;
          formattedDate = `${month}-${day} ${String(hour).padStart(2, '0')}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'daily') {
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          key = `${current.getFullYear()}-${month}-${day}`;
          formattedDate = `${month}-${day}`;
          current.setDate(current.getDate() + 1);
        } else if (format === 'weekly') {
          const weekNumber = getWeekNumber(current);
          key = `${current.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
          formattedDate = `W${weekNumber}`;
          current.setDate(current.getDate() + 7);
        } else { // monthly
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          key = `${current.getFullYear()}-${month}`;
          formattedDate = monthNames[current.getMonth()];
          current.setMonth(current.getMonth() + 1);
        }

        const orders = ordersMap.get(key) || 0;
        result.push({ date: formattedDate, orders });
      }

      return result;
    };

    const data = fillDateGaps(start, end, sortFormat);

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch processed orders chart data'
    };
  }
});

/**
 * Get refunded orders chart data with daily/monthly/yearly breakdown
 */
export const getRefundedOrdersChart = withDbConnection(async (
  filters: AdminFilters
): Promise<{ success: boolean; data?: RefundedOrdersChart[]; message?: string }> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Determine grouping format based on preset
    let groupByFormat: string;
    let sortFormat: string;

    const range = getDateRange(filters.dateRange.preset || 'this_month');
    let start: Date, end: Date;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = new Date(filters.dateRange.from);
      end = new Date(filters.dateRange.to);
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    } else {
      switch (filters.dateRange.preset as any) {
        case 'today':
        case 'yesterday':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d %H:00';
          sortFormat = 'hourly';
          break;
        case 'this_week':
        case 'last7days':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d';
          sortFormat = 'daily';
          break;
        case 'this_month':
        case 'last30days':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d';
          sortFormat = 'daily';
          break;
        case 'this_year':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m';
          sortFormat = 'monthly';
          break;
        default:
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d';
          sortFormat = 'daily';
      }
    }

    // Set timezone (you can make this configurable)
    const timezone = '+00:00';

    // Build match query for refunded orders
    const orderMatchQuery: any = {
      status: OrderStatus.REFUNDED,
      orderDate: { $gte: start, $lte: end }
    };

    if (filters.warehouseId) {
      orderMatchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Get refunded orders and group by date
    const ordersData = await Order.aggregate([
      {
        $match: orderMatchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Create a map for easy lookup
    const ordersMap = new Map(ordersData.map(item => [item._id, item.orderCount]));

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Fill in date gaps with zero values
    const fillDateGaps = (start: Date, end: Date, format: string) => {
      const result: RefundedOrdersChart[] = [];
      let current = new Date(start);
      const endDate = new Date(end);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const hour = current.getHours();
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          key = `${current.getFullYear()}-${month}-${day} ${String(hour).padStart(2, '0')}:00`;
          formattedDate = `${month}-${day} ${String(hour).padStart(2, '0')}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'daily') {
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = current.getDate();
          key = `${current.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;
          formattedDate = `${monthNames[current.getMonth()]} ${day}`;
          current.setDate(current.getDate() + 1);
        } else if (format === 'weekly') {
          const weekNumber = getWeekNumber(current);
          key = `${current.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
          formattedDate = `W${weekNumber}`;
          current.setDate(current.getDate() + 7);
        } else { // monthly
          const month = String(current.getMonth() + 1).padStart(2, '0');
          key = `${current.getFullYear()}-${month}`;
          formattedDate = monthNames[current.getMonth()];
          current.setMonth(current.getMonth() + 1);
        }

        const orders = ordersMap.get(key) || 0;
        result.push({ date: formattedDate, orders });
      }

      return result;
    };

    const data = fillDateGaps(start, end, sortFormat);

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch refunded orders chart data'
    };
  }
});

/**
 * Get refund rate chart data with daily/monthly/yearly breakdown
 * Shows percentage of refunded orders with optional seller filter
 */
export const getRefundRateChart = withDbConnection(async (
  filters: AdminFilters,
  sellerId?: string
): Promise<{ success: boolean; data?: RefundRateChart[]; message?: string }> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Determine grouping format based on preset
    let groupByFormat: string;
    let sortFormat: string;

    const range = getDateRange(filters.dateRange.preset || 'this_month');
    let start: Date, end: Date;

    if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
      start = new Date(filters.dateRange.from);
      end = new Date(filters.dateRange.to);
      groupByFormat = '%Y-%m-%d';
      sortFormat = 'daily';
    } else {
      switch (filters.dateRange.preset as any) {
        case 'today':
        case 'yesterday':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d %H:00';
          sortFormat = 'hourly';
          break;
        case 'this_week':
        case 'last7days':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d';
          sortFormat = 'daily';
          break;
        case 'this_month':
        case 'last30days':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d';
          sortFormat = 'daily';
          break;
        case 'this_year':
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m';
          sortFormat = 'monthly';
          break;
        default:
          start = range.start;
          end = range.end;
          groupByFormat = '%Y-%m-%d';
          sortFormat = 'daily';
      }
    }

    // Set timezone
    const timezone = '+00:00';

    // Build base match query
    const baseMatchQuery: any = {
      orderDate: { $gte: start, $lte: end }
    };

    if (filters.warehouseId) {
      baseMatchQuery.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    if (sellerId) {
      baseMatchQuery.sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    // Get total orders by date
    const totalOrdersData = await Order.aggregate([
      {
        $match: baseMatchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get refunded orders by date
    const refundedOrdersData = await Order.aggregate([
      {
        $match: {
          ...baseMatchQuery,
          status: OrderStatus.REFUNDED
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$orderDate',
              timezone: timezone
            }
          },
          refundedCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Create maps for easy lookup
    const totalOrdersMap = new Map(totalOrdersData.map(item => [item._id, item.orderCount]));
    const refundedOrdersMap = new Map(refundedOrdersData.map(item => [item._id, item.refundedCount]));

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Fill in date gaps and calculate refund rate
    const fillDateGaps = (start: Date, end: Date, format: string) => {
      const result: RefundRateChart[] = [];
      let current = new Date(start);
      const endDate = new Date(end);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      while (current <= endDate) {
        let key: string;
        let formattedDate: string;

        if (format === 'hourly') {
          const hour = current.getHours();
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          key = `${current.getFullYear()}-${month}-${day} ${String(hour).padStart(2, '0')}:00`;
          formattedDate = `${month}-${day} ${String(hour).padStart(2, '0')}:00`;
          current.setHours(current.getHours() + 1);
        } else if (format === 'daily') {
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = current.getDate();
          key = `${current.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;
          formattedDate = `${monthNames[current.getMonth()]} ${day}`;
          current.setDate(current.getDate() + 1);
        } else if (format === 'weekly') {
          const weekNumber = getWeekNumber(current);
          key = `${current.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
          formattedDate = `W${weekNumber}`;
          current.setDate(current.getDate() + 7);
        } else { // monthly
          const month = String(current.getMonth() + 1).padStart(2, '0');
          key = `${current.getFullYear()}-${month}`;
          formattedDate = monthNames[current.getMonth()];
          current.setMonth(current.getMonth() + 1);
        }

        const totalOrders = totalOrdersMap.get(key) || 0;
        const refundedOrders = refundedOrdersMap.get(key) || 0;
        const refundRate = totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0;

        result.push({
          date: formattedDate,
          refundRate: Math.round(refundRate * 100) / 100, // Round to 2 decimal places
          refundedOrders,
          totalOrders
        });
      }

      return result;
    };

    const data = fillDateGaps(start, end, sortFormat);

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch refund rate chart data'
    };
  }
});

/**
 * Get open delivery issues count
 * Shows number of unresolved order-related tickets
 */
export const getOpenDeliveryIssues = withDbConnection(async (
  filters: AdminFilters
): Promise<{ success: boolean; data?: OpenDeliveryIssues; message?: string }> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.SUPER_ADMIN)) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Import Ticket model
    const { Ticket } = await import('@/lib/db/models/ticket');

    // Build match query for all tickets (no status filter to get all statuses)
    // Include all categories since delivery issues can be technical, order-related, etc.
    const matchQuery: any = {};

    // Count tickets by status
    const tickets = await Ticket.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize counts
    let openCount = 0;
    let assignedCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let closedCount = 0;

    // Map the results
    tickets.forEach(item => {
      switch (item._id) {
        case 'open':
          openCount = item.count;
          break;
        case 'assigned':
          assignedCount = item.count;
          break;
        case 'in_progress':
          inProgressCount = item.count;
          break;
        case 'resolved':
          resolvedCount = item.count;
          break;
        case 'closed':
          closedCount = item.count;
          break;
      }
    });

    const totalIssues = openCount + assignedCount + inProgressCount + resolvedCount + closedCount;

    const data: OpenDeliveryIssues = {
      totalIssues,
      openCount,
      assignedCount,
      inProgressCount,
      resolvedCount,
      closedCount
    };

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch open delivery issues data'
    };
  }
});
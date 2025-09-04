'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import User, { UserRole, UserStatus } from '@/lib/db/models/user';
import Order from '@/lib/db/models/order';
import Product from '@/lib/db/models/product';
import Warehouse from '@/lib/db/models/warehouse';
import DeliveryStats from '@/lib/db/models/delivery-stats';
import Expedition from '@/lib/db/models/expedition';

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
      return {
        start: weekStart,
        end: now
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
    if (!user || user.role !== UserRole.ADMIN) {
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
      orderFilter.warehouseId = filters.warehouseId;
      productFilter['warehouses.warehouseId'] = filters.warehouseId;
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
    if (!user || user.role !== UserRole.ADMIN) {
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
      matchQuery.warehouseId = filters.warehouseId;
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

    const totalUsers = usersByRole.reduce((sum, item) => sum + item.count, 0);

    const data: UsersByRole[] = usersByRole.map(item => ({
      role: item._id,
      count: item.count,
      percentage: totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0
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
    if (!user || user.role !== UserRole.ADMIN) {
      return { success: false, message: 'Unauthorized. Admin access required.' };
    }

    // Build match query based on filters
    const matchQuery: any = {};

    if (filters?.orderStatus) {
      matchQuery.status = filters.orderStatus;
    }

    if (filters?.warehouseId) {
      matchQuery.warehouseId = filters.warehouseId;
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
    if (!user || user.role !== UserRole.ADMIN) {
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
      matchQuery.warehouseId = filters.warehouseId;
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

export const getTopPerformers = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: TopPerformers[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
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
    if (!user || user.role !== UserRole.ADMIN) {
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
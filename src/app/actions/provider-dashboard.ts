'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import Expedition from '@/lib/db/models/expedition';
import { ExpeditionStatus, ProviderType, TransportMode } from '@/app/dashboard/_constant/expedition';

export interface ProviderDashboardStats {
  totalExpeditions: number;
  activeExpeditions: number;
  completedExpeditions: number;
  pendingApproval: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageDeliveryTime: number;
  successRate: number;
  totalWeight: number;
  totalProducts: number;
}

export interface ExpeditionStatusChart {
  status: string;
  count: number;
  percentage: number;
}

export interface RevenueChart {
  date: string;
  revenue: number;
  expeditions: number;
}

export interface TransportModeChart {
  mode: string;
  count: number;
  percentage: number;
  weight: number;
}

export interface PerformanceMetrics {
  month: string;
  expeditions: number;
  revenue: number;
  avgDeliveryTime: number;
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
    
    default:
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
  }
};

export const getProviderDashboardStats = withDbConnection(async (startDate?: string, endDate?: string): Promise<{
  success: boolean;
  message?: string;
  data?: ProviderDashboardStats;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.PROVIDER) {
      return { success: false, message: 'Unauthorized. Provider access required.' };
    }

    let fromDate: Date;
    let toDate: Date;
    
    if (startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      const range = getDateRange('this_month');
      fromDate = range.start;
      toDate = range.end;
    }

    // Current month for monthly revenue
    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

    const baseQuery = {
      providerId: user._id,
      providerType: ProviderType.REGISTERED
    };

    // Parallel queries for performance
    const [
      totalExpeditions,
      activeExpeditions,
      completedExpeditions,
      pendingApproval,
      monthlyExpeditions,
      completedWithDates,
      allExpeditions
    ] = await Promise.all([
      Expedition.countDocuments(baseQuery),
      Expedition.countDocuments({
        ...baseQuery,
        status: { $in: [ExpeditionStatus.APPROVED, ExpeditionStatus.IN_TRANSIT] }
      }),
      Expedition.countDocuments({
        ...baseQuery,
        status: ExpeditionStatus.DELIVERED
      }),
      Expedition.countDocuments({
        ...baseQuery,
        status: ExpeditionStatus.PENDING
      }),
      Expedition.find({
        ...baseQuery,
        createdAt: { $gte: monthStart }
      }).select('paymentAmount').lean(),
      Expedition.find({
        ...baseQuery,
        status: ExpeditionStatus.DELIVERED,
        actualDelivery: { $exists: true },
        approvedAt: { $exists: true }
      }).select('actualDelivery approvedAt').lean(),
      Expedition.find(baseQuery).select('paymentAmount totalQuantity weight').lean()
    ]);

    // Calculate revenue
    const totalRevenue = allExpeditions.reduce((sum, exp) => sum + (exp.paymentAmount || 0), 0);
    const monthlyRevenue = monthlyExpeditions.reduce((sum, exp) => sum + (exp.paymentAmount || 0), 0);

    // Calculate average delivery time
    let averageDeliveryTime = 0;
    if (completedWithDates.length > 0) {
      const totalTime = completedWithDates.reduce((sum, exp) => {
        if (exp.actualDelivery && exp.approvedAt) {
          return sum + (new Date(exp.actualDelivery).getTime() - new Date(exp.approvedAt).getTime());
        }
        return sum;
      }, 0);
      averageDeliveryTime = Math.round(totalTime / completedWithDates.length / (1000 * 60 * 60 * 24)); // Days
    }

    // Calculate success rate
    const successRate = totalExpeditions > 0 ? 
      Math.round((completedExpeditions / totalExpeditions) * 100) : 0;

    // Calculate totals
    const totalWeight = allExpeditions.reduce((sum, exp) => sum + (exp.weight || 0), 0);
    const totalProducts = allExpeditions.reduce((sum, exp) => sum + (exp.totalQuantity || 0), 0);

    const stats: ProviderDashboardStats = {
      totalExpeditions,
      activeExpeditions,
      completedExpeditions,
      pendingApproval,
      totalRevenue,
      monthlyRevenue,
      averageDeliveryTime,
      successRate,
      totalWeight,
      totalProducts
    };

    return { success: true, data: stats };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch provider dashboard stats'
    };
  }
});

export const getExpeditionStatusChart = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: ExpeditionStatusChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.PROVIDER) {
      return { success: false, message: 'Unauthorized. Provider access required.' };
    }

    const statusCounts = await Expedition.aggregate([
      {
        $match: {
          providerId: user._id,
          providerType: ProviderType.REGISTERED
        }
      },
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

    const totalExpeditions = statusCounts.reduce((sum, item) => sum + item.count, 0);

    const data: ExpeditionStatusChart[] = statusCounts.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalExpeditions > 0 ? Math.round((item.count / totalExpeditions) * 100) : 0
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch expedition status chart data'
    };
  }
});

export const getRevenueChart = withDbConnection(async (startDate?: string, endDate?: string): Promise<{
  success: boolean;
  message?: string;
  data?: RevenueChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.PROVIDER) {
      return { success: false, message: 'Unauthorized. Provider access required.' };
    }

    let fromDate: Date;
    let toDate: Date;
    
    if (startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      // Default to last 30 days
      toDate = new Date();
      fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const expeditions = await Expedition.find({
      providerId: user._id,
      providerType: ProviderType.REGISTERED,
      createdAt: { $gte: fromDate, $lte: toDate },
      paymentAmount: { $gt: 0 }
    }).select('createdAt paymentAmount').lean();

    // Group by date
    const dailyData: { [key: string]: { revenue: number, expeditions: number } } = {};

    expeditions.forEach(expedition => {
      const dateStr = new Date(expedition.createdAt).toISOString().slice(0, 10);
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { revenue: 0, expeditions: 0 };
      }
      dailyData[dateStr].revenue += expedition.paymentAmount || 0;
      dailyData[dateStr].expeditions++;
    });

    // Fill missing dates with zero values
    const result: RevenueChart[] = [];
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const data = dailyData[dateStr] || { revenue: 0, expeditions: 0 };
      result.push({
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.round(data.revenue * 100) / 100,
        expeditions: data.expeditions
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch revenue chart data'
    };
  }
});

export const getTransportModeChart = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: TransportModeChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.PROVIDER) {
      return { success: false, message: 'Unauthorized. Provider access required.' };
    }

    const modeData = await Expedition.aggregate([
      {
        $match: {
          providerId: user._id,
          providerType: ProviderType.REGISTERED
        }
      },
      {
        $group: {
          _id: '$transportMode',
          count: { $sum: 1 },
          totalWeight: { $sum: '$weight' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalExpeditions = modeData.reduce((sum, item) => sum + item.count, 0);

    const data: TransportModeChart[] = modeData.map(item => ({
      mode: item._id,
      count: item.count,
      percentage: totalExpeditions > 0 ? Math.round((item.count / totalExpeditions) * 100) : 0,
      weight: Math.round(item.totalWeight * 10) / 10
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch transport mode chart data'
    };
  }
});

export const getRecentExpeditions = withDbConnection(async (limit: number = 10): Promise<{
  success: boolean;
  message?: string;
  data?: any[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.PROVIDER) {
      return { success: false, message: 'Unauthorized. Provider access required.' };
    }

    const recentExpeditions = await Expedition.find({
      providerId: user._id,
      providerType: ProviderType.REGISTERED
    })
      .populate('sellerId', 'name')
      .populate('warehouseId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id expeditionCode status totalQuantity weight paymentAmount createdAt sellerId warehouseId fromCountry transportMode')
      .lean();

    const activities = recentExpeditions.map((expedition: any) => ({
      type: 'expedition',
      id: expedition._id.toString(),
      expeditionCode: expedition.expeditionCode,
      title: `Expedition ${expedition.expeditionCode}`,
      description: `${expedition.totalQuantity} products • ${expedition.weight}kg from ${expedition.fromCountry}`,
      date: expedition.createdAt,
      status: expedition.status,
      amount: expedition.paymentAmount || 0,
      warehouse: expedition.warehouseId?.name,
      seller: expedition.sellerId?.name,
      transportMode: expedition.transportMode
    }));

    return { success: true, data: activities };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch recent expeditions'
    };
  }
});

export const getActiveExpeditions = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: any[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.PROVIDER) {
      return { success: false, message: 'Unauthorized. Provider access required.' };
    }

    const activeExpeditions = await Expedition.find({
      providerId: user._id,
      providerType: ProviderType.REGISTERED,
      status: { 
        $in: [
          ExpeditionStatus.APPROVED,
          ExpeditionStatus.IN_TRANSIT
        ]
      }
    })
      .populate('sellerId', 'name')
      .populate('warehouseId', 'name')
      .sort({ expeditionDate: 1 })
      .lean();

    const formattedExpeditions = activeExpeditions.map((expedition: any) => {
      const isOverdue = expedition.estimatedDelivery && new Date() > new Date(expedition.estimatedDelivery);

      return {
        _id: expedition._id.toString(),
        expeditionCode: expedition.expeditionCode,
        sellerName: expedition.sellerId?.name,
        warehouseName: expedition.warehouseId?.name,
        fromCountry: expedition.fromCountry,
        totalProducts: expedition.totalProducts,
        totalQuantity: expedition.totalQuantity,
        weight: expedition.weight,
        status: expedition.status,
        transportMode: expedition.transportMode,
        expeditionDate: expedition.expeditionDate,
        estimatedDelivery: expedition.estimatedDelivery,
        trackingNumber: expedition.trackingNumber,
        paymentAmount: expedition.paymentAmount,
        isOverdue
      };
    });

    return {
      success: true,
      data: formattedExpeditions,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch active expeditions',
    };
  }
});
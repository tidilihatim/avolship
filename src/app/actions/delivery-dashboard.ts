'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole, UserStatus } from '@/lib/db/models/user';
import User from '@/lib/db/models/user';
import Order, { OrderStatus } from '@/lib/db/models/order';
import DeliveryStats from '@/lib/db/models/delivery-stats';

export interface DeliveryDashboardStats {
  totalDeliveries: number;
  todayDeliveries: number;
  totalEarnings: number;
  todayEarnings: number;
  pendingPickups: number;
  inTransitDeliveries: number;
  averageDeliveryTime: number;
  totalDistance: number;
  successRate: number;
}

export interface DeliveryStatusChart {
  status: string;
  count: number;
  percentage: number;
}

export interface EarningsChart {
  date: string;
  earnings: number;
  deliveries: number;
}

export interface DeliveryTimeChart {
  timeSlot: string;
  deliveries: number;
  averageTime: number;
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

export const getDeliveryDashboardStats = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: DeliveryDashboardStats;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.DELIVERY) {
      return { success: false, message: 'Unauthorized. Delivery access required.' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get or create delivery stats
    const deliveryStats = await DeliveryStats.getOrCreateStats(user._id);

    // Get pending orders assigned to this delivery person
    const pendingPickups = await Order.countDocuments({
      'deliveryTracking.deliveryGuyId': user._id,
      status: { $in: [OrderStatus.ASSIGNED_TO_DELIVERY] }
    });

    // Get in-transit deliveries
    const inTransitDeliveries = await Order.countDocuments({
      'deliveryTracking.deliveryGuyId': user._id,
      status: { $in: [OrderStatus.ACCEPTED_BY_DELIVERY, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY] }
    });

    // Get all completed deliveries for this user
    const completedDeliveries = await Order.find({
      'deliveryTracking.deliveryGuyId': user._id,
      status: OrderStatus.DELIVERED,
      'deliveryTracking.actualDeliveryTime': { $exists: true }
    }).select('deliveryTracking').lean();

    // Calculate average delivery time (from pickup to delivery)
    let averageDeliveryTime = 0;
    if (completedDeliveries.length > 0) {
      const totalTime = completedDeliveries.reduce((sum, order) => {
        if (order.deliveryTracking?.pickedUpAt && order.deliveryTracking?.actualDeliveryTime) {
          const pickupTime = new Date(order.deliveryTracking.pickedUpAt).getTime();
          const deliveryTime = new Date(order.deliveryTracking.actualDeliveryTime).getTime();
          return sum + (deliveryTime - pickupTime);
        }
        return sum;
      }, 0);
      averageDeliveryTime = Math.round(totalTime / completedDeliveries.length / (1000 * 60)); // Convert to minutes
    }

    // Calculate success rate (delivered vs failed)
    const totalAssigned = await Order.countDocuments({
      'deliveryTracking.deliveryGuyId': user._id
    });
    const successfulDeliveries = await Order.countDocuments({
      'deliveryTracking.deliveryGuyId': user._id,
      status: OrderStatus.DELIVERED
    });
    const successRate = totalAssigned > 0 ? Math.round((successfulDeliveries / totalAssigned) * 100) : 0;

    const stats: DeliveryDashboardStats = {
      totalDeliveries: deliveryStats.totalDeliveries,
      todayDeliveries: deliveryStats.getTodayDeliveries(),
      totalEarnings: deliveryStats.totalEarnings,
      todayEarnings: deliveryStats.getTodayEarnings(),
      pendingPickups,
      inTransitDeliveries,
      averageDeliveryTime,
      totalDistance: deliveryStats.totalDistance,
      successRate
    };

    return { success: true, data: stats };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch delivery dashboard stats'
    };
  }
});

export const getDeliveryStatusChart = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: DeliveryStatusChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.DELIVERY) {
      return { success: false, message: 'Unauthorized. Delivery access required.' };
    }

    const statusCounts = await Order.aggregate([
      {
        $match: {
          'deliveryTracking.deliveryGuyId': user._id
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

    const totalOrders = statusCounts.reduce((sum, item) => sum + item.count, 0);

    const data: DeliveryStatusChart[] = statusCounts.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch delivery status chart data'
    };
  }
});

export const getEarningsChart = withDbConnection(async (startDate?: string, endDate?: string): Promise<{
  success: boolean;
  message?: string;
  data?: EarningsChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.DELIVERY) {
      return { success: false, message: 'Unauthorized. Delivery access required.' };
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

    const deliveryStats = await DeliveryStats.findOne({ deliveryGuyId: user._id });
    if (!deliveryStats) {
      return { success: true, data: [] };
    }

    // Group deliveries by date
    const dailyData: { [key: string]: { earnings: number, deliveries: number } } = {};

    deliveryStats.deliveryHistory.forEach(record => {
      const recordDate = new Date(record.deliveryDate);
      if (recordDate >= fromDate && recordDate <= toDate) {
        const dateStr = recordDate.toISOString().slice(0, 10);
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = { earnings: 0, deliveries: 0 };
        }
        dailyData[dateStr].earnings += record.deliveryFee + record.commission;
        dailyData[dateStr].deliveries++;
      }
    });

    // Fill missing dates with zero values
    const result: EarningsChart[] = [];
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const data = dailyData[dateStr] || { earnings: 0, deliveries: 0 };
      result.push({
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        earnings: Math.round(data.earnings * 100) / 100, // Round to 2 decimal places
        deliveries: data.deliveries
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch earnings chart data'
    };
  }
});

export const getDeliveryTimeChart = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: DeliveryTimeChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.DELIVERY) {
      return { success: false, message: 'Unauthorized. Delivery access required.' };
    }

    // Get completed deliveries for this user
    const completedDeliveries = await Order.find({
      'deliveryTracking.deliveryGuyId': user._id,
      status: OrderStatus.DELIVERED,
      'deliveryTracking.pickedUpAt': { $exists: true },
      'deliveryTracking.actualDeliveryTime': { $exists: true }
    }).select('deliveryTracking').lean();

    const timeSlots = [
      { slot: '8-10 AM', start: 8, end: 10 },
      { slot: '10-12 PM', start: 10, end: 12 },
      { slot: '12-2 PM', start: 12, end: 14 },
      { slot: '2-4 PM', start: 14, end: 16 },
      { slot: '4-6 PM', start: 16, end: 18 },
      { slot: '6-8 PM', start: 18, end: 20 }
    ];

    const slotData = timeSlots.map(slot => {
      const deliveriesInSlot = completedDeliveries.filter(order => {
        if (!order.deliveryTracking?.actualDeliveryTime) return false;
        const hour = new Date(order.deliveryTracking.actualDeliveryTime).getHours();
        return hour >= slot.start && hour < slot.end;
      });

      const averageTime = deliveriesInSlot.length > 0 ? 
        deliveriesInSlot.reduce((sum, order) => {
          if (order.deliveryTracking?.pickedUpAt && order.deliveryTracking?.actualDeliveryTime) {
            const pickupTime = new Date(order.deliveryTracking.pickedUpAt).getTime();
            const deliveryTime = new Date(order.deliveryTracking.actualDeliveryTime).getTime();
            return sum + (deliveryTime - pickupTime);
          }
          return sum;
        }, 0) / deliveriesInSlot.length / (1000 * 60) : 0; // Convert to minutes

      return {
        timeSlot: slot.slot,
        deliveries: deliveriesInSlot.length,
        averageTime: Math.round(averageTime)
      };
    });

    return { success: true, data: slotData };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch delivery time chart data'
    };
  }
});

export const getRecentDeliveries = withDbConnection(async (limit: number = 10): Promise<{
  success: boolean;
  message?: string;
  data?: any[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.DELIVERY) {
      return { success: false, message: 'Unauthorized. Delivery access required.' };
    }

    const recentDeliveries = await Order.find({
      'deliveryTracking.deliveryGuyId': user._id
    })
      .populate('sellerId', 'name')
      .populate('warehouseId', 'name')
      .sort({ 'deliveryTracking.assignedAt': -1 })
      .limit(limit)
      .select('_id orderId status totalPrice orderDate customer sellerId warehouseId deliveryTracking')
      .lean();

    const activities = recentDeliveries.map((order: any) => ({
      type: 'delivery',
      id: order._id.toString(),
      orderId: order.orderId,
      title: `Delivery #${order.orderId}`,
      description: `${order.customer?.name || 'Unknown Customer'} - $${order.totalPrice}`,
      date: order.deliveryTracking?.assignedAt || order.orderDate,
      status: order.status,
      amount: order.totalPrice,
      warehouse: order.warehouseId?.name,
      seller: order.sellerId?.name,
      trackingNumber: order.deliveryTracking?.trackingNumber
    }));

    return { success: true, data: activities };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch recent deliveries'
    };
  }
});

export const getActiveDeliveries = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: any[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.DELIVERY) {
      return { success: false, message: 'Unauthorized. Delivery access required.' };
    }

    const activeOrders = await Order.find({
      'deliveryTracking.deliveryGuyId': user._id,
      status: { 
        $in: [
          OrderStatus.ASSIGNED_TO_DELIVERY,
          OrderStatus.ACCEPTED_BY_DELIVERY,
          OrderStatus.IN_TRANSIT,
          OrderStatus.OUT_FOR_DELIVERY
        ]
      }
    })
      .populate('warehouseId', 'name')
      .populate('sellerId', 'name')
      .sort({ 'deliveryTracking.assignedAt': -1 })
      .lean();

    const formattedOrders = activeOrders.map((order: any) => {
      const estimatedTime = order.deliveryTracking?.estimatedDeliveryTime;
      const isOverdue = estimatedTime && new Date() > new Date(estimatedTime);

      return {
        _id: order._id.toString(),
        orderId: order.orderId,
        customerName: order.customer.name,
        customerPhone: order.customer.phoneNumbers?.[0],
        totalPrice: order.totalPrice,
        status: order.status,
        warehouse: order.warehouseId?.name,
        seller: order.sellerId?.name,
        trackingNumber: order.deliveryTracking?.trackingNumber,
        assignedAt: order.deliveryTracking?.assignedAt,
        estimatedDeliveryTime: estimatedTime,
        isOverdue,
        deliveryAddress: order.customer.shippingAddress,
        deliveryFee: order.deliveryTracking?.deliveryFee || 0,
        commission: order.deliveryTracking?.commission || 0
      };
    });

    return {
      success: true,
      data: formattedOrders,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch active deliveries',
    };
  }
});
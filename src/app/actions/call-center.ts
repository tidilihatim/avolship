"use server";

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole, UserStatus } from '@/lib/db/models/user';
import User from '@/lib/db/models/user';
import Order, { OrderStatus } from '@/lib/db/models/order';

interface DeliveryRider {
  _id: string;
  name: string;
  email: string;
  country: string;
}

/**
 * Get call center dashboard statistics for the current agent
 */
export const getCallCenterStats = withDbConnection(async (startDate?: string, endDate?: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    // Set date range
    let fromDate: Date;
    let toDate: Date;
    
    if (startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      // Default to today
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date();
      toDate.setHours(23, 59, 59, 999);
    }

    // Simple direct queries
    const totalOrdersAssigned = await Order.countDocuments({
      assignedAgent: user._id
    });

    const pendingOrders = await Order.countDocuments({
      assignedAgent: user._id,
      status: OrderStatus.PENDING
    });

    // Get all orders with call attempts for this agent
    const ordersWithCalls = await Order.find({
      assignedAgent: user._id,
      callAttempts: { $exists: true, $ne: [] }
    }).lean();

    let totalCallsInRange = 0;
    let answeredCallsInRange = 0;
    let totalCallDuration = 0; // in seconds
    let callsWithDuration = 0;

    // Count call attempts in date range and collect duration data
    ordersWithCalls.forEach(order => {
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            totalCallsInRange++;
            if (attempt.status === 'answered') {
              answeredCallsInRange++;
            }
            
            // Collect duration from recording if available
            if (attempt.recording && attempt.recording.duration) {
              totalCallDuration += attempt.recording.duration;
              callsWithDuration++;
            }
          }
        });
      }
    });

    // Count confirmed orders in date range
    const confirmedInRange = await Order.countDocuments({
      assignedAgent: user._id,
      status: OrderStatus.CONFIRMED,
      statusChangedAt: { $gte: fromDate, $lte: toDate }
    });

    const successRate = totalCallsInRange > 0 
      ? Math.round((answeredCallsInRange / totalCallsInRange) * 100) 
      : 0;

    // Calculate average call time using real duration data when available
    let avgCallTime = 0;
    if (callsWithDuration > 0) {
      // Use real duration data (convert seconds to minutes)
      avgCallTime = Math.round((totalCallDuration / callsWithDuration / 60) * 10) / 10;
    } else if (totalCallsInRange > 0) {
      // Fallback to estimation: answered calls ~3 minutes, others ~0.5 minutes
      avgCallTime = Math.round(((answeredCallsInRange * 3 + (totalCallsInRange - answeredCallsInRange) * 0.5) / totalCallsInRange) * 10) / 10;
    }

    return {
      success: true,
      stats: {
        totalOrdersToday: totalOrdersAssigned,
        pendingConfirmations: pendingOrders,
        successfulCalls: answeredCallsInRange,
        unreachedToday: totalCallsInRange - answeredCallsInRange,
        totalCallAttempts: totalCallsInRange,
        successRate,
        avgCallTime,
        queueLength: pendingOrders,
        activeCalls: 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching call center stats:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch statistics',
    };
  }
});

/**
 * Get priority queue orders for the current agent
 */
export const getPriorityQueue = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const priorityOrders = await Order.find({
      assignedAgent: user._id,
      status: OrderStatus.PENDING
    })
      .populate('warehouseId', 'name currency')
      .populate('sellerId', 'name')
      .sort({
        totalCallAttempts: -1,
        orderDate: 1
      })
      .limit(20)
      .lean();

    const formattedOrders = priorityOrders.map((order: any) => {
      const waitingTime = Math.floor((Date.now() - new Date(order.orderDate).getTime()) / (1000 * 60));

      let priority = 'normal';
      if (waitingTime > 240 || order.totalCallAttempts >= 3) priority = 'urgent';
      else if (waitingTime > 120 || order.totalCallAttempts >= 2) priority = 'high';

      return {
        _id: order._id.toString(),
        orderId: order.orderId,
        customerName: order.customer.name,
        phoneNumbers: order.customer.phoneNumbers,
        totalPrice: order.totalPrice,
        currency: order.warehouseId?.currency || 'USD',
        waitingTime: waitingTime,
        attempts: order.totalCallAttempts || 0,
        lastCallAttempt: order.lastCallAttempt,
        priority,
        warehouseName: order.warehouseId?.name || 'Unknown',
        sellerName: order.sellerId?.name || 'Unknown',
        orderDate: order.orderDate,
        shippingAddress: order.customer.shippingAddress
      };
    });

    return {
      success: true,
      orders: formattedOrders,
    };
  } catch (error: any) {
    console.error('Error fetching priority queue:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch priority queue',
    };
  }
});

/**
 * Get recent activity feed for the current agent
 */
export const getRecentActivity = withDbConnection(async (startDate?: string, endDate?: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    // Set date range
    let fromDate: Date;
    let toDate: Date;
    
    if (startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      // Default to last 24 hours
      toDate = new Date();
      fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get orders with recent activity - limit to recent orders for better performance
    const orders = await Order.find({
      assignedAgent: user._id,
      $or: [
        { statusChangedAt: { $gte: fromDate, $lte: toDate } },
        { 'callAttempts.attemptDate': { $gte: fromDate, $lte: toDate } }
      ]
    })
    .sort({ updatedAt: -1 })

    const activities: any[] = [];

    orders.forEach((order: any) => {
      // Add status changes
      if (order.statusChangedAt && order.statusChangedAt >= fromDate && order.statusChangedAt <= toDate) {
        activities.push({
          type: 'status_change',
          orderId: order.orderId,
          message: `Order ${order.orderId} marked as ${order.status.replace('_', ' ')} for ${order.customer.name}`,
          timestamp: order.statusChangedAt,
          status: order.status,
        });
      }

      // Add call attempts
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            const statusText = attempt.status === 'answered' ? 'answered' :
                              attempt.status === 'unreached' ? 'no answer' :
                              attempt.status === 'busy' ? 'busy' :
                              attempt.status === 'invalid' ? 'invalid number' : attempt.status;

            activities.push({
              type: 'call_attempt',
              orderId: order.orderId,
              message: `Called ${order.customer.name} at ${attempt.phoneNumber} - ${statusText}`,
              timestamp: attempt.attemptDate,
              status: attempt.status,
            });
          }
        });
      }
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      activities: activities,
    };
  } catch (error: any) {
    console.error('Error fetching recent activity:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch recent activity',
    };
  }
});

/**
 * Get call outcome distribution for charts
 */
export const getCallOutcomeData = withDbConnection(async (startDate?: string, endDate?: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    // Set date range
    let fromDate: Date;
    let toDate: Date;
    
    if (startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date();
      toDate.setHours(23, 59, 59, 999);
    }

    // Get all orders with call attempts
    const orders = await Order.find({
      assignedAgent: user._id,
      callAttempts: { $exists: true, $ne: [] }
    }).lean();

    const outcomes = {
      answered: 0,
      unreached: 0,
      busy: 0,
      invalid: 0
    };

    // Count outcomes in date range
    orders.forEach(order => {
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            if (outcomes.hasOwnProperty(attempt.status)) {
              outcomes[attempt.status as keyof typeof outcomes]++;
            }
          }
        });
      }
    });

    const total = Object.values(outcomes).reduce((sum, count) => sum + count, 0);

    const formattedData = [
      {
        name: 'Answered',
        value: total > 0 ? Math.round((outcomes.answered / total) * 100) : 0,
        className: 'text-green-600 dark:text-green-400',
        count: outcomes.answered
      },
      {
        name: 'No Answer',
        value: total > 0 ? Math.round((outcomes.unreached / total) * 100) : 0,
        className: 'text-yellow-600 dark:text-yellow-400',
        count: outcomes.unreached
      },
      {
        name: 'Busy',
        value: total > 0 ? Math.round((outcomes.busy / total) * 100) : 0,
        className: 'text-red-600 dark:text-red-400',
        count: outcomes.busy
      },
      {
        name: 'Invalid Number',
        value: total > 0 ? Math.round((outcomes.invalid / total) * 100) : 0,
        className: 'text-muted-foreground',
        count: outcomes.invalid
      },
    ].filter(item => item.count > 0);

    return {
      success: true,
      data: formattedData,
      total: total
    };
  } catch (error: any) {
    console.error('Error fetching call outcome data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch outcome data',
    };
  }
});

/**
 * Get hourly call data for charts
 */
export const getHourlyCallData = withDbConnection(async (startDate?: string, endDate?: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    // Set date range
    let fromDate: Date;
    let toDate: Date;
    
    if (startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date();
      toDate.setHours(23, 59, 59, 999);
    }

    // Get all orders with call attempts
    const orders = await Order.find({
      assignedAgent: user._id,
      callAttempts: { $exists: true, $ne: [] }
    }).lean();

    const hourlyStats: { [key: number]: { calls: number, confirmed: number } } = {};

    // Initialize hours 8-17
    for (let hour = 8; hour <= 17; hour++) {
      hourlyStats[hour] = { calls: 0, confirmed: 0 };
    }

    // Count calls by hour
    orders.forEach(order => {
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            const hour = attemptDate.getHours();
            if (hour >= 8 && hour <= 17) {
              hourlyStats[hour].calls++;
              if (attempt.status === 'answered') {
                hourlyStats[hour].confirmed++;
              }
            }
          }
        });
      }
    });

    const formattedData = [];
    for (let hour = 8; hour <= 17; hour++) {
      formattedData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        calls: hourlyStats[hour].calls,
        confirmed: hourlyStats[hour].confirmed,
      });
    }

    return {
      success: true,
      data: formattedData,
    };
  } catch (error: any) {
    console.error('Error fetching hourly call data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch hourly data',
    };
  }
});

/**
 * Get weekly performance data
 */
export const getWeeklyPerformanceData = withDbConnection(async (startDate?: string, endDate?: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    // Set date range
    let fromDate: Date;
    let toDate: Date;
    
    if (startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      // Default to last 7 days
      toDate = new Date();
      fromDate = new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const orders = await Order.find({
      assignedAgent: user._id,
      orderDate: { $gte: fromDate, $lte: toDate }
    }).lean();

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyStats: { [key: number]: { calls: number, success: number } } = {};

    // Initialize days
    for (let i = 0; i < 7; i++) {
      dailyStats[i] = { calls: 0, success: 0 };
    }

    // Count by day of week
    orders.forEach(order => {
      const dayOfWeek = new Date(order.orderDate).getDay();
      dailyStats[dayOfWeek].calls++;
      if (order.status === OrderStatus.CONFIRMED) {
        dailyStats[dayOfWeek].success++;
      }
    });

    const formattedData = dayNames.map((day, index) => ({
      day,
      calls: dailyStats[index].calls,
      success: dailyStats[index].success,
    }));

    return {
      success: true,
      data: formattedData,
    };
  } catch (error: any) {
    console.error('Error fetching weekly performance data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch weekly data',
    };
  }
});

/**
 * Get call center performance trends over time
 */
export const getPerformanceTrends = withDbConnection(async (startDate?: string, endDate?: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
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

    // Get orders with call attempts in the date range
    const orders = await Order.find({
      assignedAgent: user._id,
      callAttempts: { $exists: true, $ne: [] }
    }).lean();

    // Group data by date
    const dailyData: { [key: string]: { calls: number, answered: number, confirmed: number } } = {};

    orders.forEach(order => {
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            const dateStr = attemptDate.toISOString().slice(0, 10);
            if (!dailyData[dateStr]) {
              dailyData[dateStr] = { calls: 0, answered: 0, confirmed: 0 };
            }
            dailyData[dateStr].calls++;
            if (attempt.status === 'answered') {
              dailyData[dateStr].answered++;
            }
          }
        });
      }

      // Count confirmed orders
      if (order.status === OrderStatus.CONFIRMED && order.statusChangedAt) {
        const statusDate = new Date(order.statusChangedAt);
        if (statusDate >= fromDate && statusDate <= toDate) {
          const dateStr = statusDate.toISOString().slice(0, 10);
          if (!dailyData[dateStr]) {
            dailyData[dateStr] = { calls: 0, answered: 0, confirmed: 0 };
          }
          dailyData[dateStr].confirmed++;
        }
      }
    });

    // Convert to array and fill missing dates
    const result = [];
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const data = dailyData[dateStr] || { calls: 0, answered: 0, confirmed: 0 };
      result.push({
        date: dateStr,
        calls: data.calls,
        answered: data.answered,
        confirmed: data.confirmed,
        successRate: data.calls > 0 ? Math.round((data.answered / data.calls) * 100) : 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Error fetching performance trends:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch performance trends',
    };
  }
});

/**
 * Get call center priority distribution data
 */
export const getPriorityDistribution = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const orders = await Order.find({
      assignedAgent: user._id,
      status: OrderStatus.PENDING
    }).lean();

    const priorities = { urgent: 0, high: 0, normal: 0 };

    orders.forEach(order => {
      const waitingTime = Math.floor((Date.now() - new Date(order.orderDate).getTime()) / (1000 * 60));
      let priority = 'normal';
      if (waitingTime > 240 || order.totalCallAttempts >= 3) priority = 'urgent';
      else if (waitingTime > 120 || order.totalCallAttempts >= 2) priority = 'high';

      priorities[priority as keyof typeof priorities]++;
    });

    const total = Object.values(priorities).reduce((sum, count) => sum + count, 0);

    const data = [
      {
        priority: 'Urgent',
        count: priorities.urgent,
        percentage: total > 0 ? Math.round((priorities.urgent / total) * 100) : 0
      },
      {
        priority: 'High',
        count: priorities.high,
        percentage: total > 0 ? Math.round((priorities.high / total) * 100) : 0
      },
      {
        priority: 'Normal',
        count: priorities.normal,
        percentage: total > 0 ? Math.round((priorities.normal / total) * 100) : 0
      }
    ].filter(item => item.count > 0);

    return {
      success: true,
      data,
      total
    };
  } catch (error: any) {
    console.error('Error fetching priority distribution:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch priority distribution',
    };
  }
});

/**
 * Add call attempt to order
 */
export const addCallAttempt = withDbConnection(async (
  orderId: string,
  phoneNumber: string,
  status: 'answered' | 'unreached' | 'busy' | 'invalid',
  notes?: string
) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const order = await Order.findOne({
      _id: orderId,
      assignedAgent: user._id
    });

    if (!order) {
      return {
        success: false,
        message: 'Order not found or not assigned to you',
      };
    }

    // Add new call attempt
    const attemptNumber = (order.callAttempts?.length || 0) + 1;
    const newAttempt = {
      attemptNumber,
      phoneNumber,
      attemptDate: new Date(),
      status,
      notes: notes || '',
      callCenterAgent: user._id,
    };

    order.callAttempts.push(newAttempt);

    // Update order status based on call result
    if (status === 'answered') {
      order.status = OrderStatus.CONFIRMED;
      order.statusChangedBy = user._id;
      order.statusChangedAt = new Date();
    } else if (status === 'invalid') {
      order.status = OrderStatus.WRONG_NUMBER;
      order.statusChangedBy = user._id;
      order.statusChangedAt = new Date();
    } else if (status === 'unreached' && order.totalCallAttempts >= 2) {
      order.status = OrderStatus.UNREACHED;
      order.statusChangedBy = user._id;
      order.statusChangedAt = new Date();
    }

    await order.save();

    return {
      success: true,
      message: 'Call attempt recorded successfully',
      newStatus: order.status
    };
  } catch (error: any) {
    console.error('Error adding call attempt:', error);
    return {
      success: false,
      message: error.message || 'Failed to record call attempt',
    };
  }
});

/**
 * Get order details for calling interface
 */
export const getOrderForCalling = withDbConnection(async (orderId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const order = await Order.findOne({
      _id: orderId,
      assignedAgent: user._id
    })
      .populate('warehouseId', 'name currency')
      .populate('sellerId', 'name')
      .populate('products.productId', 'name')
      .lean();

    if (!order) {
      return {
        success: false,
        message: 'Order not found or not assigned to you',
      };
    }

    return {
      success: true,
      order: {
        _id: (order as any)._id.toString(),
        orderId: (order as any).orderId,
        customer: (order as any).customer,
        products: (order as any).products,
        totalPrice: (order as any).totalPrice,
        status: (order as any).status,
        callAttempts: (order as any).callAttempts || [],
        warehouseName: (order as any).warehouseId?.name,
        sellerName: (order as any).sellerId?.name,
        orderDate: (order as any).orderDate,
        totalCallAttempts: (order as any).totalCallAttempts || 0
      }
    };
  } catch (error: any) {
    console.error('Error fetching order for calling:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch order details',
    };
  }
});

/**
 * Lock/Unlock order functions
 */
export const lockOrder = withDbConnection(async (orderId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return { success: false, message: 'Unauthorized access' };
    }

    const lockExpiry = new Date();
    lockExpiry.setMinutes(lockExpiry.getMinutes() + 15);

    const order = await Order.findOne({ _id: orderId, assignedAgent: user._id });
    if (!order) {
      return { success: false, message: 'Order not found or not assigned to you' };
    }

    if (order.lockedBy && order.lockedBy.toString() !== user._id.toString() && order.lockExpiry && order.lockExpiry > new Date()) {
      return { success: false, message: 'Order is currently being worked on by another agent' };
    }

    order.lockedBy = user._id;
    order.lockedAt = new Date();
    order.lockExpiry = lockExpiry;
    await order.save();

    return { success: true, message: 'Order locked successfully', lockExpiry };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to lock order' };
  }
});

export const unlockOrder = withDbConnection(async (orderId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return { success: false, message: 'Unauthorized access' };
    }

    const order = await Order.findOne({ _id: orderId, assignedAgent: user._id });
    if (!order) {
      return { success: false, message: 'Order not found or not assigned to you' };
    }

    if (order.lockedBy && order.lockedBy.toString() !== user._id.toString()) {
      return { success: false, message: 'You can only unlock orders you have locked' };
    }

    order.lockedBy = undefined;
    order.lockedAt = undefined;
    order.lockExpiry = undefined;
    await order.save();

    return { success: true, message: 'Order unlocked successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to unlock order' };
  }
});

// Admin functions (simplified)
export const assignOrderToAgent = withDbConnection(async (orderId: string, agentId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
      return { success: false, message: 'Unauthorized access' };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    order.assignedAgent = agentId;
    order.assignedAt = new Date();
    await order.save();

    return { success: true, message: 'Order assigned successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to assign order' };
  }
});

export const updateCustomerInfo = withDbConnection(async (orderId: string, customerData: any) => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.CALL_CENTER, UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Unauthorized access' };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    order.customer = { ...order.customer, ...customerData };
    await order.save();

    return { success: true, message: 'Customer information updated successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to update customer information' };
  }
});

export const getAgentWorkloadStats = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
      return { success: false, message: 'Unauthorized access' };
    }

    // Simplified agent stats
    return { success: true, agents: [] };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to fetch agent statistics' };
  }
});

export const getAvailableRiders = withDbConnection(async (country: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.CALL_CENTER, UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Unauthorized access' };
    }

    // Get delivery riders with approved status and matching country
    const riders = await User.find({
      role: UserRole.DELIVERY,
      status: UserStatus.APPROVED,
      country: country
    })
    .select('_id name email country')
    .lean();

    // Transform to match frontend interface
    const transformedRiders: DeliveryRider[] = riders.map(rider => ({
      _id: (rider?._id as any)?.toString(),
      name: rider.name,
      email: rider.email,
      country: rider.country || ''
    }));

    return { success: true, riders: transformedRiders };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to fetch delivery riders' };
  }
});
"use server";

import mongoose from 'mongoose';
import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import Order, { OrderStatus } from '@/lib/db/models/order';
import User from '@/lib/db/models/user';
import Warehouse from '@/lib/db/models/warehouse';
import Product from '@/lib/db/models/product';

/**
 * Get call center dashboard statistics
 */
export const getCallCenterStats = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's statistics
    const [
      totalOrdersToday,
      pendingConfirmations,
      confirmedToday,
      unreachedToday,
      totalCallAttempts,
      ordersWithCalls,
    ] = await Promise.all([
      Order.countDocuments({
        orderDate: { $gte: today, $lt: tomorrow }
      }),
      Order.countDocuments({
        status: OrderStatus.PENDING
      }),
      Order.countDocuments({
        status: OrderStatus.CONFIRMED,
        statusChangedAt: { $gte: today, $lt: tomorrow }
      }),
      Order.countDocuments({
        status: OrderStatus.UNREACHED,
        statusChangedAt: { $gte: today, $lt: tomorrow }
      }),
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: '$totalCallAttempts' }
          }
        }
      ]),
      Order.countDocuments({
        orderDate: { $gte: today, $lt: tomorrow },
        totalCallAttempts: { $gt: 0 }
      }),
    ]);

    // Calculate success rate
    const successfulCalls = confirmedToday;
    const successRate = ordersWithCalls > 0 ? Math.round((successfulCalls / ordersWithCalls) * 100) : 0;

    // Calculate average call time (mock for now, can be enhanced with actual call duration tracking)
    const avgCallTime = 2.3; // minutes

    return {
      success: true,
      stats: {
        totalOrdersToday,
        pendingConfirmations,
        successfulCalls,
        unreachedToday,
        totalCallAttempts: totalCallAttempts[0]?.totalAttempts || 0,
        customersContacted: ordersWithCalls,
        successRate,
        avgCallTime,
        queueLength: pendingConfirmations,
        activeCalls: 0, // This would need real-time tracking
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
 * Get hourly call data for charts
 */
export const getHourlyCallData = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Aggregate call attempts by hour
    const hourlyData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: today, $lt: tomorrow },
          callAttempts: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$callAttempts'
      },
      {
        $match: {
          'callAttempts.attemptDate': { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: { $hour: '$callAttempts.attemptDate' },
          totalCalls: { $sum: 1 },
          confirmedCalls: {
            $sum: {
              $cond: [{ $eq: ['$callAttempts.status', 'answered'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format data for charts (ensure all hours 8-17 are included)
    const formattedData = [];
    for (let hour = 8; hour <= 17; hour++) {
      const hourData = hourlyData.find(d => d._id === hour);
      formattedData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        calls: hourData?.totalCalls || 0,
        confirmed: hourData?.confirmedCalls || 0,
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
 * Get call outcome distribution
 */
export const getCallOutcomeData = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const outcomes = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: today, $lt: tomorrow },
          callAttempts: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$callAttempts'
      },
      {
        $match: {
          'callAttempts.attemptDate': { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$callAttempts.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = outcomes.reduce((sum, outcome) => sum + outcome.count, 0);
    
    const formattedData = [
      {
        name: 'Confirmed',
        value: Math.round(((outcomes.find(o => o._id === 'answered')?.count || 0) / total) * 100) || 0,
        color: '#22c55e'
      },
      {
        name: 'No Answer',
        value: Math.round(((outcomes.find(o => o._id === 'unreached')?.count || 0) / total) * 100) || 0,
        color: '#f59e0b'
      },
      {
        name: 'Busy',
        value: Math.round(((outcomes.find(o => o._id === 'busy')?.count || 0) / total) * 100) || 0,
        color: '#ef4444'
      },
      {
        name: 'Invalid Number',
        value: Math.round(((outcomes.find(o => o._id === 'invalid')?.count || 0) / total) * 100) || 0,
        color: '#6b7280'
      },
    ].filter(item => item.value > 0);

    return {
      success: true,
      data: formattedData,
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
 * Get weekly performance data
 */
export const getWeeklyPerformanceData = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: weekAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$orderDate' },
          totalOrders: { $sum: 1 },
          confirmedOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', OrderStatus.CONFIRMED] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedData = dayNames.map((day, index) => {
      const dayData = weeklyData.find(d => d._id === index + 1);
      return {
        day,
        calls: dayData?.totalOrders || 0,
        success: dayData?.confirmedOrders || 0,
      };
    });

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
 * Get priority queue orders
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

    // Get pending orders sorted by priority criteria
    const priorityOrders = await Order.find({
      status: OrderStatus.PENDING
    })
    .populate('warehouseId', 'name currency')
    .populate('sellerId', 'name')
    .sort({ 
      totalCallAttempts: -1, // Orders with more attempts first
      orderDate: 1 // Older orders first
    })
    .limit(10)
    .lean();

    const formattedOrders = priorityOrders.map((order: any) => {
      const waitingTime = Math.floor((Date.now() - new Date(order.orderDate).getTime()) / (1000 * 60)); // minutes
      
      let priority = 'normal';
      if (waitingTime > 120) priority = 'urgent'; // 2+ hours
      else if (waitingTime > 60) priority = 'high'; // 1+ hour

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
 * Get recent activity feed
 */
export const getRecentActivity = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Get recent status changes
    const recentStatusChanges = await Order.find({
      statusChangedAt: { $gte: oneHourAgo },
      statusChangedBy: { $exists: true }
    })
    .populate('statusChangedBy', 'name')
    .sort({ statusChangedAt: -1 })
    .limit(10)
    .lean();

    // Get recent call attempts
    const recentCallAttempts = await Order.find({
      'callAttempts.attemptDate': { $gte: oneHourAgo }
    })
    .populate('callAttempts.callCenterAgent', 'name')
    .sort({ 'callAttempts.attemptDate': -1 })
    .limit(5)
    .lean();

    const activities: any = [];

    // Add status changes
    recentStatusChanges.forEach((order: any) => {
      activities.push({
        type: 'status_change',
        orderId: order.orderId,
        message: `Order ${order.orderId} ${order.status} by ${order.statusChangedBy?.name || 'System'}`,
        timestamp: order.statusChangedAt,
        status: order.status,
      });
    });

    // Add call attempts
    recentCallAttempts.forEach((order: any) => {
      const latestCall = order.callAttempts[order.callAttempts.length - 1];
      if (latestCall && latestCall.attemptDate >= oneHourAgo) {
        activities.push({
          type: 'call_attempt',
          orderId: order.orderId,
          message: `Call attempt to ${order.customer.name} - ${latestCall.status}`,
          timestamp: latestCall.attemptDate,
          status: latestCall.status,
        });
      }
    });

    // Sort all activities by timestamp
    activities.sort((a:any, b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      activities: activities.slice(0, 10),
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
 * Manually assign order to specific call center agent (Admin/Moderator only)
 */
export const assignOrderToAgent = withDbConnection(async (
  orderId: string,
  agentId: string
) => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
      return {
        success: false,
        message: 'Only admins and moderators can assign orders to agents',
      };
    }

    // Verify the target agent exists and is a call center agent
    const targetAgent = await User.findById(agentId);
    if (!targetAgent || targetAgent.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Invalid call center agent specified',
      };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // Assign order to agent
    order.assignedAgent = new mongoose.Types.ObjectId(agentId);
    order.assignedAt = new Date();
    await order.save();

    return {
      success: true,
      message: `Order assigned to ${targetAgent.name} successfully`,
      agentName: targetAgent.name,
    };
  } catch (error: any) {
    console.error('Error assigning order:', error);
    return {
      success: false,
      message: error.message || 'Failed to assign order',
    };
  }
});

/**
 * Lock order for current agent (prevents other agents from working on it)
 */
export const lockOrder = withDbConnection(async (orderId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const lockDurationMinutes = 15; // Lock for 15 minutes
    const lockExpiry = new Date();
    lockExpiry.setMinutes(lockExpiry.getMinutes() + lockDurationMinutes);

    const order = await Order.findById(orderId);
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // Check if order is locked by another agent
    if (order.lockedBy && 
        order.lockedBy.toString() !== user._id.toString() && 
        order.lockExpiry && 
        order.lockExpiry > new Date()) {
      return {
        success: false,
        message: 'Order is currently being worked on by another agent',
      };
    }

    // Lock the order
    order.lockedBy = user._id;
    order.lockedAt = new Date();
    order.lockExpiry = lockExpiry;
    await order.save();

    return {
      success: true,
      message: 'Order locked successfully',
      lockExpiry: lockExpiry,
    };
  } catch (error: any) {
    console.error('Error locking order:', error);
    return {
      success: false,
      message: error.message || 'Failed to lock order',
    };
  }
});

/**
 * Unlock order (release lock)
 */
export const unlockOrder = withDbConnection(async (orderId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // Only allow unlocking if user owns the lock or is admin
    if (order.lockedBy && order.lockedBy.toString() !== user._id.toString()) {
      return {
        success: false,
        message: 'You can only unlock orders you have locked',
      };
    }

    // Unlock the order
    order.lockedBy = undefined;
    order.lockedAt = undefined;
    order.lockExpiry = undefined;
    await order.save();

    return {
      success: true,
      message: 'Order unlocked successfully',
    };
  } catch (error: any) {
    console.error('Error unlocking order:', error);
    return {
      success: false,
      message: error.message || 'Failed to unlock order',
    };
  }
});

/**
 * Get orders assigned to current agent (formatted like getOrders)
 */
export const getMyAssignedOrders = withDbConnection(async (page = 1, limit = 20) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const skip = (page - 1) * limit;

    // Clean up expired locks first
    await Order.updateMany(
      { lockExpiry: { $lte: new Date() } },
      { 
        $unset: { 
          lockedBy: 1, 
          lockedAt: 1, 
          lockExpiry: 1 
        } 
      }
    );

    // For call center agents: show only their assigned orders (any status)
    const query = {
      assignedAgent: user._id
    };

    console.log('Call center agent ID:', user._id);
    console.log('Query for assigned orders:', query);

    // Get orders with populated data (same format as getOrders)
    const orders = await Order.find(query)
    .populate('warehouseId', 'name country currency')
    .populate('sellerId', 'name email businessName')
    .populate('assignedAgent', 'name')
    .populate('lockedBy', 'name')
    .populate('statusChangedBy', 'name role')
    .populate('callAttempts.callCenterAgent', 'name role')
    .sort({ orderDate: 1 }) // Oldest first
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await Order.countDocuments(query);

    // Format orders to match the expected structure
    const formattedOrders = orders.map((order: any) => ({
      _id: order._id.toString(),
      orderId: order.orderId,
      customer: order.customer,
      warehouseId: order.warehouseId?._id?.toString(),
      warehouseName: order.warehouseId?.name || 'Unknown Warehouse',
      warehouseCountry: order.warehouseId?.country || 'Unknown',
      sellerId: order.sellerId?._id?.toString(),
      sellerName: order.sellerId?.name || 'Unknown Seller',
      products: order.products.map((product: any) => ({
        ...product,
        productId: product.productId.toString(),
        expeditionId: product.expeditionId?.toString(),
      })),
      totalPrice: order.totalPrice,
      status: order.status,
      statusComment: order.statusComment,
      statusChangedBy: order.statusChangedBy ? {
        _id: order.statusChangedBy._id.toString(),
        name: order.statusChangedBy.name,
        role: order.statusChangedBy.role,
      } : undefined,
      statusChangedAt: order.statusChangedAt,
      callAttempts: order.callAttempts || [],
      totalCallAttempts: order.totalCallAttempts || 0,
      lastCallAttempt: order.lastCallAttempt,
      lastCallStatus: order.callAttempts?.length > 0 ? 
        order.callAttempts[order.callAttempts.length - 1].status : undefined,
      isDouble: order.isDouble || false,
      doubleOrderReferences: order.doubleOrderReferences || [],
      orderDate: order.orderDate,
      assignedAgent: order.assignedAgent?.name,
      lockedBy: order.lockedBy?.name,
      lockExpiry: order.lockExpiry,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return {
      success: true,
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      message: total === 0 ? 
        'No orders assigned to you yet.' : 
        'Showing your assigned orders'
    };
  } catch (error: any) {
    console.error('Error fetching assigned orders:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch assigned orders',
    };
  }
});

/**
 * Auto-assign orders to agents based on workload (Admin/Moderator only)
 */
export const autoAssignOrders = withDbConnection(async (batchSize = 20) => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
      return {
        success: false,
        message: 'Only admins and moderators can auto-assign orders',
      };
    }

    // Get all active call center agents
    const agents = await User.find({ 
      role: UserRole.CALL_CENTER,
      status: { $ne: 'inactive' } // Exclude inactive agents
    }).lean();
    
    if (agents.length === 0) {
      return {
        success: false,
        message: 'No active call center agents available',
      };
    }

    // Get unassigned pending orders (prioritize older orders)
    const unassignedOrders = await Order.find({
      status: { $in: [OrderStatus.PENDING, OrderStatus.UNREACHED] },
      assignedAgent: { $exists: false }
    })
    .sort({ 
      orderDate: 1, // Oldest first
      totalCallAttempts: -1 // Orders with more attempts get priority
    })
    .limit(batchSize)
    .lean();

    if (unassignedOrders.length === 0) {
      return {
        success: true,
        message: 'No unassigned orders to process',
        assigned: 0,
      };
    }

    // Get current workload for each agent (more comprehensive metrics)
    const agentWorkloads = await Promise.all(
      agents.map(async (agent) => {
        const [assignedPending, assignedUnreached, totalAssigned] = await Promise.all([
          Order.countDocuments({
            assignedAgent: agent._id,
            status: OrderStatus.PENDING
          }),
          Order.countDocuments({
            assignedAgent: agent._id,
            status: OrderStatus.UNREACHED
          }),
          Order.countDocuments({
            assignedAgent: agent._id,
            status: { $in: [OrderStatus.PENDING, OrderStatus.UNREACHED] }
          })
        ]);

        // Calculate workload score (pending orders weight more than unreached)
        const workloadScore = (assignedPending * 1.5) + (assignedUnreached * 1.0);

        return { 
          agentId: agent._id, 
          agentName: agent.name,
          totalAssigned,
          pendingCount: assignedPending,
          unreachedCount: assignedUnreached,
          workloadScore
        };
      })
    );

    // Sort agents by workload score (least busy first)
    agentWorkloads.sort((a, b) => a.workloadScore - b.workloadScore);

    // Assign orders to agents with lowest workload
    let assignedCount = 0;
    const assignmentResults = [];

    for (const order of unassignedOrders) {
      // Find agent with lowest current workload
      const selectedAgent = agentWorkloads.reduce((min, current) => 
        current.workloadScore < min.workloadScore ? current : min
      );

      // Assign order to selected agent
      await Order.findByIdAndUpdate(order._id, {
        assignedAgent: selectedAgent.agentId,
        assignedAt: new Date(),
      });

      // Update local workload counter
      selectedAgent.workloadScore += 1.5; // Treat as pending order
      selectedAgent.totalAssigned++;
      selectedAgent.pendingCount++;

      assignmentResults.push({
        orderId: order.orderId,
        agentName: selectedAgent.agentName,
      });

      assignedCount++;
    }

    return {
      success: true,
      message: `Successfully assigned ${assignedCount} orders to agents`,
      assigned: assignedCount,
      assignments: assignmentResults,
      agentWorkloads: agentWorkloads.map(agent => ({
        agentName: agent.agentName,
        totalAssigned: agent.totalAssigned,
        pendingCount: agent.pendingCount,
        unreachedCount: agent.unreachedCount,
      })),
    };
  } catch (error: any) {
    console.error('Error auto-assigning orders:', error);
    return {
      success: false,
      message: error.message || 'Failed to auto-assign orders',
    };
  }
});

/**
 * Get agent workload statistics (for admin dashboard)
 */
export const getAgentWorkloadStats = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const agents = await User.find({ role: UserRole.CALL_CENTER }).lean();
    
    const agentStats = await Promise.all(
      agents.map(async (agent) => {
        const [pending, unreached, confirmed, total] = await Promise.all([
          Order.countDocuments({
            assignedAgent: agent._id,
            status: OrderStatus.PENDING
          }),
          Order.countDocuments({
            assignedAgent: agent._id,
            status: OrderStatus.UNREACHED
          }),
          Order.countDocuments({
            assignedAgent: agent._id,
            status: OrderStatus.CONFIRMED,
            statusChangedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
          }),
          Order.countDocuments({
            assignedAgent: agent._id,
            status: { $in: [OrderStatus.PENDING, OrderStatus.UNREACHED] }
          })
        ]);

        return {
          agentId: agent._id,
          agentName: agent.name,
          pendingOrders: pending,
          unreachedOrders: unreached,
          confirmedToday: confirmed,
          totalActiveOrders: total,
          workloadScore: (pending * 1.5) + (unreached * 1.0),
        };
      })
    );

    return {
      success: true,
      agents: agentStats.sort((a, b) => b.totalActiveOrders - a.totalActiveOrders),
    };
  } catch (error: any) {
    console.error('Error fetching agent workload stats:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch agent statistics',
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

    const order = await Order.findById(orderId);
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
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
    }

    await order.save();

    return {
      success: true,
      message: 'Call attempt recorded successfully',
    };
  } catch (error: any) {
    console.error('Error adding call attempt:', error);
    return {
      success: false,
      message: error.message || 'Failed to record call attempt',
    };
  }
});
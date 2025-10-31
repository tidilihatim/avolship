"use server";

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import User from '@/lib/db/models/user';
import Order from '@/lib/db/models/order';

/**
 * Types for chart data
 */
export interface TotalCallsMadeData {
  date: string;
  calls: number;
  answered: number;
  unreached: number;
}

export interface ConfirmationRateData {
  date: string;
  totalCalls: number;
  confirmedOrders: number;
  confirmationRate: number;
}

export interface AverageCallDurationData {
  date: string;
  avgDuration: number; // in seconds
  totalCalls: number;
  totalDuration: number; // in seconds
}

export interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  agentEmail: string;
  totalOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  confirmationRate: number; // percentage
  deliveryRate: number; // percentage
  performanceScore: number; // weighted score (0.4 × Confirmation % + 0.6 × Delivery %)
  rank?: number; // position in ranking
}

export interface FollowUpCallsData {
  date: string;
  followUpCalls: number; // orders requiring > 2 calls
  totalCalls: number;
  followUpRate: number; // percentage
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';
}

export interface CallCenterFilter extends DateRangeFilter {
  callCenterUserId?: string; // For admin to filter by specific call center user
}

/**
 * Helper function to calculate date range based on period
 */
function getDateRange(filter: DateRangeFilter): { fromDate: Date; toDate: Date } {
  const now = new Date();
  let fromDate: Date;
  let toDate: Date;

  if (filter.startDate && filter.endDate) {
    fromDate = new Date(filter.startDate);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(filter.endDate);
    toDate.setHours(23, 59, 59, 999);
  } else {
    switch (filter.period) {
      case 'today':
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
        break;

      case 'yesterday':
        fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - 1);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setDate(toDate.getDate() - 1);
        toDate.setHours(23, 59, 59, 999);
        break;

      case 'this_week':
        fromDate = new Date(now);
        const day = fromDate.getDay();
        fromDate.setDate(fromDate.getDate() - day);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
        break;

      case 'this_month':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
        break;

      case 'this_year':
        fromDate = new Date(now.getFullYear(), 0, 1);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
        break;

      default:
        // Default to today
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
    }
  }

  return { fromDate, toDate };
}

/**
 * Helper function to get grouping format based on date range
 */
function getGroupingFormat(fromDate: Date, toDate: Date): 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' {
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return 'hourly';
  if (diffDays <= 31) return 'daily';
  if (diffDays <= 90) return 'weekly';
  if (diffDays <= 365) return 'monthly';
  return 'yearly';
}

/**
 * Get Total Calls Made data for Call Center user
 */
export const getTotalCallsMadeData = withDbConnection(async (filter: DateRangeFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);
    const grouping = getGroupingFormat(fromDate, toDate);

    console.log('[getTotalCallsMadeData] Date range:', {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      grouping
    });

    // Get all orders with call attempts for this agent
    const orders = await Order.find({
      assignedAgent: user._id,
      callAttempts: { $exists: true, $ne: [] }
    }).lean();

    console.log('[getTotalCallsMadeData] Found orders:', orders.length);

    // Group data by time period
    const groupedData: { [key: string]: { calls: number, answered: number, unreached: number } } = {};
    let totalAttemptsProcessed = 0;

    orders.forEach(order => {
      if (order.callAttempts) {
        console.log('[getTotalCallsMadeData] Order callAttempts count:', order.callAttempts.length);
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          const inRange = attemptDate >= fromDate && attemptDate <= toDate;
          console.log('[getTotalCallsMadeData] Attempt date:', attemptDate.toISOString(), 'In range?', inRange);
          if (inRange) {
            totalAttemptsProcessed++;
            let key: string;

            switch (grouping) {
              case 'hourly':
                const year = attemptDate.getFullYear();
                const month = String(attemptDate.getMonth() + 1).padStart(2, '0');
                const day = String(attemptDate.getDate()).padStart(2, '0');
                const hour = String(attemptDate.getHours()).padStart(2, '0');
                key = `${year}-${month}-${day}T${hour}:00:00`;
                break;
              case 'daily':
                key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-${String(attemptDate.getDate()).padStart(2, '0')}`;
                break;
              case 'weekly':
                const weekStart = new Date(attemptDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                break;
              case 'monthly':
                key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-01`;
                break;
              case 'yearly':
                key = `${attemptDate.getFullYear()}-01-01`;
                break;
            }

            if (!groupedData[key]) {
              groupedData[key] = { calls: 0, answered: 0, unreached: 0 };
            }

            groupedData[key].calls++;
            if (attempt.status === 'answered') {
              groupedData[key].answered++;
            } else {
              groupedData[key].unreached++;
            }
          }
        });
      }
    });

    // Convert to array and fill missing dates
    const result: TotalCallsMadeData[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      let key: string;

      switch (grouping) {
        case 'hourly':
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const hour = String(currentDate.getHours()).padStart(2, '0');
          key = `${year}-${month}-${day}T${hour}:00:00`;
          break;
        case 'daily':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          key = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      const data = groupedData[key] || { calls: 0, answered: 0, unreached: 0 };
      result.push({
        date: key,
        calls: data.calls,
        answered: data.answered,
        unreached: data.unreached
      });

      // Increment date
      if (grouping === 'hourly') {
        currentDate.setHours(currentDate.getHours() + 1);
      } else if (grouping === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (grouping === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (grouping === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (grouping === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    // Calculate totals
    const totalCalls = result.reduce((sum, item) => sum + item.calls, 0);
    const totalAnswered = result.reduce((sum, item) => sum + item.answered, 0);
    const totalUnreached = result.reduce((sum, item) => sum + item.unreached, 0);

    return {
      success: true,
      data: result,
      grouping,
      totals: {
        calls: totalCalls,
        answered: totalAnswered,
        unreached: totalUnreached,
        answerRate: totalCalls > 0 ? Math.round((totalAnswered / totalCalls) * 100) : 0
      }
    };
  } catch (error: any) {
    console.error('Error fetching total calls made data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch total calls made data',
    };
  }
});

/**
 * Get Total Calls Made data for Admin (with call center user filter)
 */
export const getAdminTotalCallsMadeData = withDbConnection(async (filter: CallCenterFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);
    const grouping = getGroupingFormat(fromDate, toDate);

    // Build query based on filter
    const query: any = {
      callAttempts: { $exists: true, $ne: [] }
    };

    // If specific call center user is selected
    if (filter.callCenterUserId && filter.callCenterUserId !== 'all') {
      query.assignedAgent = filter.callCenterUserId;
    }

    // Get all orders with call attempts
    const orders = await Order.find(query).lean();

    // Group data by time period
    const groupedData: { [key: string]: { calls: number, answered: number, unreached: number } } = {};

    orders.forEach(order => {
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            let key: string;

            switch (grouping) {
              case 'hourly':
                const year = attemptDate.getFullYear();
                const month = String(attemptDate.getMonth() + 1).padStart(2, '0');
                const day = String(attemptDate.getDate()).padStart(2, '0');
                const hour = String(attemptDate.getHours()).padStart(2, '0');
                key = `${year}-${month}-${day}T${hour}:00:00`;
                break;
              case 'daily':
                key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-${String(attemptDate.getDate()).padStart(2, '0')}`;
                break;
              case 'weekly':
                const weekStart = new Date(attemptDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                break;
              case 'monthly':
                key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-01`;
                break;
              case 'yearly':
                key = `${attemptDate.getFullYear()}-01-01`;
                break;
            }

            if (!groupedData[key]) {
              groupedData[key] = { calls: 0, answered: 0, unreached: 0 };
            }

            groupedData[key].calls++;
            if (attempt.status === 'answered') {
              groupedData[key].answered++;
            } else {
              groupedData[key].unreached++;
            }
          }
        });
      }
    });

    // Convert to array and fill missing dates
    const result: TotalCallsMadeData[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      let key: string;

      switch (grouping) {
        case 'hourly':
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const hour = String(currentDate.getHours()).padStart(2, '0');
          key = `${year}-${month}-${day}T${hour}:00:00`;
          break;
        case 'daily':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          key = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      const data = groupedData[key] || { calls: 0, answered: 0, unreached: 0 };
      result.push({
        date: key,
        calls: data.calls,
        answered: data.answered,
        unreached: data.unreached
      });

      // Increment date
      if (grouping === 'hourly') {
        currentDate.setHours(currentDate.getHours() + 1);
      } else if (grouping === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (grouping === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (grouping === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (grouping === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    // Calculate totals
    const totalCalls = result.reduce((sum, item) => sum + item.calls, 0);
    const totalAnswered = result.reduce((sum, item) => sum + item.answered, 0);
    const totalUnreached = result.reduce((sum, item) => sum + item.unreached, 0);

    return {
      success: true,
      data: result,
      grouping,
      totals: {
        calls: totalCalls,
        answered: totalAnswered,
        unreached: totalUnreached,
        answerRate: totalCalls > 0 ? Math.round((totalAnswered / totalCalls) * 100) : 0
      }
    };
  } catch (error: any) {
    console.error('Error fetching admin total calls made data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch total calls made data',
    };
  }
});

/**
 * Get list of all call center users (for admin filter dropdown)
 */
export const getCallCenterUsers = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const callCenterUsers = await User.find({
      role: UserRole.CALL_CENTER
    })
      .select('_id name email')
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      users: callCenterUsers.map((u:any) => ({
        _id: u._id.toString(),
        name: u.name,
        email: u.email
      }))
    };
  } catch (error: any) {
    console.error('Error fetching call center users:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch call center users',
    };
  }
});

/**
 * Get Confirmation Rate data for Call Center user
 */
export const getConfirmationRateData = withDbConnection(async (filter: DateRangeFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);
    const grouping = getGroupingFormat(fromDate, toDate);

    // Get all orders for this agent
    const orders = await Order.find({
      assignedAgent: user._id,
      callAttempts: { $exists: true, $ne: [] }
    }).lean();

    // Group data by time period
    const groupedData: { [key: string]: { totalCalls: number, confirmedOrders: number } } = {};

    // Count call attempts by time period
    orders.forEach(order => {
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            let key: string;

            switch (grouping) {
              case 'hourly':
                const year = attemptDate.getFullYear();
                const month = String(attemptDate.getMonth() + 1).padStart(2, '0');
                const day = String(attemptDate.getDate()).padStart(2, '0');
                const hour = String(attemptDate.getHours()).padStart(2, '0');
                key = `${year}-${month}-${day}T${hour}:00:00`;
                break;
              case 'daily':
                key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-${String(attemptDate.getDate()).padStart(2, '0')}`;
                break;
              case 'weekly':
                const weekStart = new Date(attemptDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                break;
              case 'monthly':
                key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-01`;
                break;
              case 'yearly':
                key = `${attemptDate.getFullYear()}-01-01`;
                break;
            }

            if (!groupedData[key]) {
              groupedData[key] = { totalCalls: 0, confirmedOrders: 0 };
            }

            groupedData[key].totalCalls++;
          }
        });
      }

      // Count confirmed orders by confirmation date
      // Include all statuses that indicate successful confirmation
      const successfulStatuses = ['confirmed', 'shipped', 'assigned_to_delivery', 'accepted_by_delivery', 'in_transit', 'out_for_delivery', 'delivered'];
      if (successfulStatuses.includes(order.status) && order.statusChangedAt) {
        const confirmDate = new Date(order.statusChangedAt);
        if (confirmDate >= fromDate && confirmDate <= toDate) {
          let key: string;

          switch (grouping) {
            case 'hourly':
              const year = confirmDate.getFullYear();
              const month = String(confirmDate.getMonth() + 1).padStart(2, '0');
              const day = String(confirmDate.getDate()).padStart(2, '0');
              const hour = String(confirmDate.getHours()).padStart(2, '0');
              key = `${year}-${month}-${day}T${hour}:00:00`;
              break;
            case 'daily':
              key = `${confirmDate.getFullYear()}-${String(confirmDate.getMonth() + 1).padStart(2, '0')}-${String(confirmDate.getDate()).padStart(2, '0')}`;
              break;
            case 'weekly':
              const weekStart = new Date(confirmDate);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
              break;
            case 'monthly':
              key = `${confirmDate.getFullYear()}-${String(confirmDate.getMonth() + 1).padStart(2, '0')}-01`;
              break;
            case 'yearly':
              key = `${confirmDate.getFullYear()}-01-01`;
              break;
          }

          if (!groupedData[key]) {
            groupedData[key] = { totalCalls: 0, confirmedOrders: 0 };
          }

          groupedData[key].confirmedOrders++;
        }
      }
    });

    // Convert to array and fill missing dates
    const result: ConfirmationRateData[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      let key: string;

      switch (grouping) {
        case 'hourly':
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const hour = String(currentDate.getHours()).padStart(2, '0');
          key = `${year}-${month}-${day}T${hour}:00:00`;
          break;
        case 'daily':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          key = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      const data = groupedData[key] || { totalCalls: 0, confirmedOrders: 0 };
      const confirmationRate = data.totalCalls > 0
        ? Math.round((data.confirmedOrders / data.totalCalls) * 100)
        : 0;

      result.push({
        date: key,
        totalCalls: data.totalCalls,
        confirmedOrders: data.confirmedOrders,
        confirmationRate
      });

      // Increment date
      if (grouping === 'hourly') {
        currentDate.setHours(currentDate.getHours() + 1);
      } else if (grouping === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (grouping === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (grouping === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (grouping === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    // Calculate totals
    const totalCalls = result.reduce((sum, item) => sum + item.totalCalls, 0);
    const totalConfirmed = result.reduce((sum, item) => sum + item.confirmedOrders, 0);
    const overallRate = totalCalls > 0 ? Math.round((totalConfirmed / totalCalls) * 100) : 0;

    return {
      success: true,
      data: result,
      grouping,
      totals: {
        totalCalls,
        confirmedOrders: totalConfirmed,
        confirmationRate: overallRate
      }
    };
  } catch (error: any) {
    console.error('Error fetching confirmation rate data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch confirmation rate data',
    };
  }
});

/**
 * Get Confirmation Rate data for Admin (with call center user filter)
 */
export const getAdminConfirmationRateData = withDbConnection(async (filter: CallCenterFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);
    const grouping = getGroupingFormat(fromDate, toDate);

    // Build query based on filter
    const query: any = {
      callAttempts: { $exists: true, $ne: [] }
    };

    // If specific call center user is selected
    if (filter.callCenterUserId && filter.callCenterUserId !== 'all') {
      query.assignedAgent = filter.callCenterUserId;
    }

    // Get all orders
    const orders = await Order.find(query).lean();

    // Group data by time period
    const groupedData: { [key: string]: { totalCalls: number, confirmedOrders: number } } = {};

    // Count call attempts by time period
    orders.forEach(order => {
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            let key: string;

            switch (grouping) {
              case 'hourly':
                const year = attemptDate.getFullYear();
                const month = String(attemptDate.getMonth() + 1).padStart(2, '0');
                const day = String(attemptDate.getDate()).padStart(2, '0');
                const hour = String(attemptDate.getHours()).padStart(2, '0');
                key = `${year}-${month}-${day}T${hour}:00:00`;
                break;
              case 'daily':
                key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-${String(attemptDate.getDate()).padStart(2, '0')}`;
                break;
              case 'weekly':
                const weekStart = new Date(attemptDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                break;
              case 'monthly':
                key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-01`;
                break;
              case 'yearly':
                key = `${attemptDate.getFullYear()}-01-01`;
                break;
            }

            if (!groupedData[key]) {
              groupedData[key] = { totalCalls: 0, confirmedOrders: 0 };
            }

            groupedData[key].totalCalls++;
          }
        });
      }

      // Count confirmed orders by confirmation date
      // Include all statuses that indicate successful confirmation
      const successfulStatuses = ['confirmed', 'shipped', 'assigned_to_delivery', 'accepted_by_delivery', 'in_transit', 'out_for_delivery', 'delivered'];
      if (successfulStatuses.includes(order.status) && order.statusChangedAt) {
        const confirmDate = new Date(order.statusChangedAt);
        if (confirmDate >= fromDate && confirmDate <= toDate) {
          let key: string;

          switch (grouping) {
            case 'hourly':
              const year = confirmDate.getFullYear();
              const month = String(confirmDate.getMonth() + 1).padStart(2, '0');
              const day = String(confirmDate.getDate()).padStart(2, '0');
              const hour = String(confirmDate.getHours()).padStart(2, '0');
              key = `${year}-${month}-${day}T${hour}:00:00`;
              break;
            case 'daily':
              key = `${confirmDate.getFullYear()}-${String(confirmDate.getMonth() + 1).padStart(2, '0')}-${String(confirmDate.getDate()).padStart(2, '0')}`;
              break;
            case 'weekly':
              const weekStart = new Date(confirmDate);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
              break;
            case 'monthly':
              key = `${confirmDate.getFullYear()}-${String(confirmDate.getMonth() + 1).padStart(2, '0')}-01`;
              break;
            case 'yearly':
              key = `${confirmDate.getFullYear()}-01-01`;
              break;
          }

          if (!groupedData[key]) {
            groupedData[key] = { totalCalls: 0, confirmedOrders: 0 };
          }

          groupedData[key].confirmedOrders++;
        }
      }
    });

    // Convert to array and fill missing dates
    const result: ConfirmationRateData[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      let key: string;

      switch (grouping) {
        case 'hourly':
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const hour = String(currentDate.getHours()).padStart(2, '0');
          key = `${year}-${month}-${day}T${hour}:00:00`;
          break;
        case 'daily':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          key = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      const data = groupedData[key] || { totalCalls: 0, confirmedOrders: 0 };
      const confirmationRate = data.totalCalls > 0
        ? Math.round((data.confirmedOrders / data.totalCalls) * 100)
        : 0;

      result.push({
        date: key,
        totalCalls: data.totalCalls,
        confirmedOrders: data.confirmedOrders,
        confirmationRate
      });

      // Increment date
      if (grouping === 'hourly') {
        currentDate.setHours(currentDate.getHours() + 1);
      } else if (grouping === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (grouping === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (grouping === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (grouping === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    // Calculate totals
    const totalCalls = result.reduce((sum, item) => sum + item.totalCalls, 0);
    const totalConfirmed = result.reduce((sum, item) => sum + item.confirmedOrders, 0);
    const overallRate = totalCalls > 0 ? Math.round((totalConfirmed / totalCalls) * 100) : 0;

    return {
      success: true,
      data: result,
      grouping,
      totals: {
        totalCalls,
        confirmedOrders: totalConfirmed,
        confirmationRate: overallRate
      }
    };
  } catch (error: any) {
    console.error('Error fetching admin confirmation rate data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch confirmation rate data',
    };
  }
});

/**
 * Get Average Call Duration data for Call Center user
 */
export const getAverageCallDurationData = withDbConnection(async (filter: DateRangeFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);
    const grouping = getGroupingFormat(fromDate, toDate);

    // Get all orders for this agent
    const orders = await Order.find({
      assignedAgent: user._id,
      callAttempts: { $exists: true, $ne: [] }
    }).lean();

    // Group data by time period
    const groupedData: { [key: string]: { totalDuration: number, totalCalls: number } } = {};

    // Count call duration by time period
    orders.forEach(order => {
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            // Only count calls with recording duration
            if (attempt.recording && attempt.recording.duration) {
              let key: string;

              switch (grouping) {
                case 'hourly':
                  const year = attemptDate.getFullYear();
                  const month = String(attemptDate.getMonth() + 1).padStart(2, '0');
                  const day = String(attemptDate.getDate()).padStart(2, '0');
                  const hour = String(attemptDate.getHours()).padStart(2, '0');
                  key = `${year}-${month}-${day}T${hour}:00:00`;
                  break;
                case 'daily':
                  key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-${String(attemptDate.getDate()).padStart(2, '0')}`;
                  break;
                case 'weekly':
                  const weekStart = new Date(attemptDate);
                  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                  key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                  break;
                case 'monthly':
                  key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-01`;
                  break;
                case 'yearly':
                  key = `${attemptDate.getFullYear()}-01-01`;
                  break;
              }

              if (!groupedData[key]) {
                groupedData[key] = { totalDuration: 0, totalCalls: 0 };
              }

              groupedData[key].totalDuration += attempt.recording.duration;
              groupedData[key].totalCalls++;
            }
          }
        });
      }
    });

    // Convert to array and fill missing dates
    const result: AverageCallDurationData[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      let key: string;

      switch (grouping) {
        case 'hourly':
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const hour = String(currentDate.getHours()).padStart(2, '0');
          key = `${year}-${month}-${day}T${hour}:00:00`;
          break;
        case 'daily':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          key = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      const data = groupedData[key] || { totalDuration: 0, totalCalls: 0 };
      const avgDuration = data.totalCalls > 0 ? Math.round(data.totalDuration / data.totalCalls) : 0;

      result.push({
        date: key,
        avgDuration,
        totalCalls: data.totalCalls,
        totalDuration: data.totalDuration
      });

      // Increment date
      if (grouping === 'hourly') {
        currentDate.setHours(currentDate.getHours() + 1);
      } else if (grouping === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (grouping === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (grouping === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (grouping === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    // Calculate totals
    const totalDuration = result.reduce((sum, item) => sum + item.totalDuration, 0);
    const totalCalls = result.reduce((sum, item) => sum + item.totalCalls, 0);
    const overallAvgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

    return {
      success: true,
      data: result,
      grouping,
      totals: {
        avgDuration: overallAvgDuration,
        totalCalls,
        totalDuration
      }
    };
  } catch (error: any) {
    console.error('Error fetching average call duration data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch average call duration data',
    };
  }
});

/**
 * Get Average Call Duration data for Admin (with call center user filter)
 */
export const getAdminAverageCallDurationData = withDbConnection(async (filter: CallCenterFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);
    const grouping = getGroupingFormat(fromDate, toDate);

    // Build query based on filter
    const query: any = {
      callAttempts: { $exists: true, $ne: [] }
    };

    // If specific call center user is selected
    if (filter.callCenterUserId && filter.callCenterUserId !== 'all') {
      query.assignedAgent = filter.callCenterUserId;
    }

    // Get all orders
    const orders = await Order.find(query).lean();

    // Group data by time period
    const groupedData: { [key: string]: { totalDuration: number, totalCalls: number } } = {};

    // Count call duration by time period
    orders.forEach(order => {
      if (order.callAttempts) {
        order.callAttempts.forEach((attempt: any) => {
          const attemptDate = new Date(attempt.attemptDate);
          if (attemptDate >= fromDate && attemptDate <= toDate) {
            // Only count calls with recording duration
            if (attempt.recording && attempt.recording.duration) {
              let key: string;

              switch (grouping) {
                case 'hourly':
                  const year = attemptDate.getFullYear();
                  const month = String(attemptDate.getMonth() + 1).padStart(2, '0');
                  const day = String(attemptDate.getDate()).padStart(2, '0');
                  const hour = String(attemptDate.getHours()).padStart(2, '0');
                  key = `${year}-${month}-${day}T${hour}:00:00`;
                  break;
                case 'daily':
                  key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-${String(attemptDate.getDate()).padStart(2, '0')}`;
                  break;
                case 'weekly':
                  const weekStart = new Date(attemptDate);
                  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                  key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                  break;
                case 'monthly':
                  key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-01`;
                  break;
                case 'yearly':
                  key = `${attemptDate.getFullYear()}-01-01`;
                  break;
              }

              if (!groupedData[key]) {
                groupedData[key] = { totalDuration: 0, totalCalls: 0 };
              }

              groupedData[key].totalDuration += attempt.recording.duration;
              groupedData[key].totalCalls++;
            }
          }
        });
      }
    });

    // Convert to array and fill missing dates
    const result: AverageCallDurationData[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      let key: string;

      switch (grouping) {
        case 'hourly':
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const hour = String(currentDate.getHours()).padStart(2, '0');
          key = `${year}-${month}-${day}T${hour}:00:00`;
          break;
        case 'daily':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          key = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      const data = groupedData[key] || { totalDuration: 0, totalCalls: 0 };
      const avgDuration = data.totalCalls > 0 ? Math.round(data.totalDuration / data.totalCalls) : 0;

      result.push({
        date: key,
        avgDuration,
        totalCalls: data.totalCalls,
        totalDuration: data.totalDuration
      });

      // Increment date
      if (grouping === 'hourly') {
        currentDate.setHours(currentDate.getHours() + 1);
      } else if (grouping === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (grouping === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (grouping === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (grouping === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    // Calculate totals
    const totalDuration = result.reduce((sum, item) => sum + item.totalDuration, 0);
    const totalCalls = result.reduce((sum, item) => sum + item.totalCalls, 0);
    const overallAvgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

    return {
      success: true,
      data: result,
      grouping,
      totals: {
        avgDuration: overallAvgDuration,
        totalCalls,
        totalDuration
      }
    };
  } catch (error: any) {
    console.error('Error fetching admin average call duration data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch average call duration data',
    };
  }
});

/**
 * Get Agent Performance data for Call Center user (their own performance)
 */
export const getAgentPerformanceData = withDbConnection(async (filter: DateRangeFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);

    // Get all orders assigned to this agent
    const orders = await Order.find({
      assignedAgent: user._id,
      createdAt: { $gte: fromDate, $lte: toDate }
    }).lean();

    const totalOrders = orders.length;

    // Count confirmed orders (using successful statuses)
    const successfulStatuses = ['confirmed', 'shipped', 'assigned_to_delivery', 'accepted_by_delivery', 'in_transit', 'out_for_delivery', 'delivered'];
    const confirmedOrders = orders.filter((order: any) => successfulStatuses.includes(order.status)).length;

    // Count delivered orders
    const deliveredOrders = orders.filter((order: any) => order.status === 'delivered').length;

    // Calculate rates
    const confirmationRate = totalOrders > 0 ? Math.round((confirmedOrders / totalOrders) * 100) : 0;
    const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    // Calculate weighted performance score
    // Performance Score = (0.4 × Confirmation %) + (0.6 × Delivery %)
    const performanceScore = Math.round((0.4 * confirmationRate) + (0.6 * deliveryRate));

    // Get all agents' performance for ranking
    const allCallCenterUsers = await User.find({ role: UserRole.CALL_CENTER }).select('_id').lean();
    const allScores: number[] = [];

    for (const ccUser of allCallCenterUsers) {
      const userOrders = await Order.find({
        assignedAgent: ccUser._id,
        createdAt: { $gte: fromDate, $lte: toDate }
      }).lean();

      const userTotalOrders = userOrders.length;
      if (userTotalOrders === 0) continue;

      const userConfirmedOrders = userOrders.filter((order: any) => successfulStatuses.includes(order.status)).length;
      const userDeliveredOrders = userOrders.filter((order: any) => order.status === 'delivered').length;

      const userConfirmationRate = Math.round((userConfirmedOrders / userTotalOrders) * 100);
      const userDeliveryRate = Math.round((userDeliveredOrders / userTotalOrders) * 100);
      const userPerformanceScore = Math.round((0.4 * userConfirmationRate) + (0.6 * userDeliveryRate));

      allScores.push(userPerformanceScore);
    }

    // Calculate rank (how many agents have a higher score)
    allScores.sort((a, b) => b - a);
    const rank = allScores.findIndex(score => score <= performanceScore) + 1 || allScores.length + 1;

    const performanceData: AgentPerformanceData = {
      agentId: user._id.toString(),
      agentName: user.name,
      agentEmail: user.email,
      totalOrders,
      confirmedOrders,
      deliveredOrders,
      confirmationRate,
      deliveryRate,
      performanceScore,
      rank
    };

    return {
      success: true,
      data: performanceData,
      totalAgents: allCallCenterUsers.length
    };
  } catch (error: any) {
    console.error('Error fetching agent performance data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch agent performance data',
    };
  }
});

/**
 * Get Agent Performance data for Admin (all agents ranked)
 */
export const getAdminAgentPerformanceData = withDbConnection(async (filter: DateRangeFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);

    // Get all call center users
    const callCenterUsers = await User.find({
      role: UserRole.CALL_CENTER
    }).select('_id name email').lean();

    const performanceData: AgentPerformanceData[] = [];

    // Calculate performance for each agent
    for (const ccUser of callCenterUsers) {
      const orders = await Order.find({
        assignedAgent: ccUser._id,
        createdAt: { $gte: fromDate, $lte: toDate }
      }).lean();

      const totalOrders = orders.length;

      // Skip agents with no orders
      if (totalOrders === 0) continue;

      // Count confirmed orders (using successful statuses)
      const successfulStatuses = ['confirmed', 'shipped', 'assigned_to_delivery', 'accepted_by_delivery', 'in_transit', 'out_for_delivery', 'delivered'];
      const confirmedOrders = orders.filter((order: any) => successfulStatuses.includes(order.status)).length;

      // Count delivered orders
      const deliveredOrders = orders.filter((order: any) => order.status === 'delivered').length;

      // Calculate rates
      const confirmationRate = totalOrders > 0 ? Math.round((confirmedOrders / totalOrders) * 100) : 0;
      const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

      // Calculate weighted performance score
      // Performance Score = (0.4 × Confirmation %) + (0.6 × Delivery %)
      const performanceScore = Math.round((0.4 * confirmationRate) + (0.6 * deliveryRate));

      performanceData.push({
        agentId: (ccUser._id as any).toString(),
        agentName: ccUser.name || 'Unknown',
        agentEmail: ccUser.email || '',
        totalOrders,
        confirmedOrders,
        deliveredOrders,
        confirmationRate,
        deliveryRate,
        performanceScore
      });
    }

    // Sort by performance score (highest first) and assign ranks
    performanceData.sort((a, b) => b.performanceScore - a.performanceScore);
    performanceData.forEach((agent, index) => {
      agent.rank = index + 1;
    });

    return {
      success: true,
      data: performanceData,
      totalAgents: performanceData.length
    };
  } catch (error: any) {
    console.error('Error fetching admin agent performance data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch agent performance data',
    };
  }
});

/**
 * Get Follow-up Calls data for Call Center user
 */
export const getFollowUpCallsData = withDbConnection(async (filter: DateRangeFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);
    const grouping = getGroupingFormat(fromDate, toDate);

    // Get all orders with call attempts for this agent
    const orders = await Order.find({
      assignedAgent: user._id,
      callAttempts: { $exists: true, $ne: [] }
    }).lean();

    // Group data by time period
    const groupedData: { [key: string]: { followUpCalls: number, totalCalls: number } } = {};

    // Statuses that indicate problematic calls requiring follow-up
    const followUpStatuses = ['busy', 'unreachable', 'no_answer', 'postponed'];

    orders.forEach(order => {
      if (order.callAttempts && order.callAttempts.length > 0) {
        // Check if this order requires follow-up (more than 2 calls with problematic statuses)
        const problematicCalls = order.callAttempts.filter((attempt: any) =>
          followUpStatuses.includes(attempt.status)
        );

        const requiresFollowUp = problematicCalls.length >= 2;

        // Get the date of the last call attempt to categorize the order
        const lastAttempt = order.callAttempts[order.callAttempts.length - 1] as any;
        const attemptDate = new Date(lastAttempt.attemptDate);

        if (attemptDate >= fromDate && attemptDate <= toDate) {
          let key: string;

          switch (grouping) {
            case 'hourly':
              const year = attemptDate.getFullYear();
              const month = String(attemptDate.getMonth() + 1).padStart(2, '0');
              const day = String(attemptDate.getDate()).padStart(2, '0');
              const hour = String(attemptDate.getHours()).padStart(2, '0');
              key = `${year}-${month}-${day}T${hour}:00:00`;
              break;
            case 'daily':
              key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-${String(attemptDate.getDate()).padStart(2, '0')}`;
              break;
            case 'weekly':
              const weekStart = new Date(attemptDate);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
              break;
            case 'monthly':
              key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-01`;
              break;
            case 'yearly':
              key = `${attemptDate.getFullYear()}-01-01`;
              break;
          }

          if (!groupedData[key]) {
            groupedData[key] = { followUpCalls: 0, totalCalls: 0 };
          }

          groupedData[key].totalCalls++;
          if (requiresFollowUp) {
            groupedData[key].followUpCalls++;
          }
        }
      }
    });

    // Convert to array and fill missing dates
    const result: FollowUpCallsData[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      let key: string;

      switch (grouping) {
        case 'hourly':
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const hour = String(currentDate.getHours()).padStart(2, '0');
          key = `${year}-${month}-${day}T${hour}:00:00`;
          break;
        case 'daily':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          key = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      const data = groupedData[key] || { followUpCalls: 0, totalCalls: 0 };
      const followUpRate = data.totalCalls > 0 ? Math.round((data.followUpCalls / data.totalCalls) * 100) : 0;

      result.push({
        date: key,
        followUpCalls: data.followUpCalls,
        totalCalls: data.totalCalls,
        followUpRate
      });

      // Increment date
      if (grouping === 'hourly') {
        currentDate.setHours(currentDate.getHours() + 1);
      } else if (grouping === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (grouping === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (grouping === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (grouping === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    // Calculate totals
    const totalFollowUpCalls = result.reduce((sum, item) => sum + item.followUpCalls, 0);
    const totalCalls = result.reduce((sum, item) => sum + item.totalCalls, 0);
    const overallFollowUpRate = totalCalls > 0 ? Math.round((totalFollowUpCalls / totalCalls) * 100) : 0;

    return {
      success: true,
      data: result,
      grouping,
      totals: {
        followUpCalls: totalFollowUpCalls,
        totalCalls,
        followUpRate: overallFollowUpRate
      }
    };
  } catch (error: any) {
    console.error('Error fetching follow-up calls data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch follow-up calls data',
    };
  }
});

/**
 * Get Follow-up Calls data for Admin (with call center user filter)
 */
export const getAdminFollowUpCallsData = withDbConnection(async (filter: CallCenterFilter = {}) => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const { fromDate, toDate } = getDateRange(filter);
    const grouping = getGroupingFormat(fromDate, toDate);

    // Build query based on filter
    const query: any = {
      callAttempts: { $exists: true, $ne: [] }
    };

    // If specific call center user is selected
    if (filter.callCenterUserId && filter.callCenterUserId !== 'all') {
      query.assignedAgent = filter.callCenterUserId;
    }

    // Get all orders with call attempts
    const orders = await Order.find(query).lean();

    // Group data by time period
    const groupedData: { [key: string]: { followUpCalls: number, totalCalls: number } } = {};

    // Statuses that indicate problematic calls requiring follow-up
    const followUpStatuses = ['busy', 'unreachable', 'no_answer', 'postponed'];

    orders.forEach(order => {
      if (order.callAttempts && order.callAttempts.length > 0) {
        // Check if this order requires follow-up (more than 2 calls with problematic statuses)
        const problematicCalls = order.callAttempts.filter((attempt: any) =>
          followUpStatuses.includes(attempt.status)
        );

        const requiresFollowUp = problematicCalls.length >= 2;

        // Get the date of the last call attempt to categorize the order
        const lastAttempt = order.callAttempts[order.callAttempts.length - 1] as any;
        const attemptDate = new Date(lastAttempt.attemptDate);

        if (attemptDate >= fromDate && attemptDate <= toDate) {
          let key: string;

          switch (grouping) {
            case 'hourly':
              const year = attemptDate.getFullYear();
              const month = String(attemptDate.getMonth() + 1).padStart(2, '0');
              const day = String(attemptDate.getDate()).padStart(2, '0');
              const hour = String(attemptDate.getHours()).padStart(2, '0');
              key = `${year}-${month}-${day}T${hour}:00:00`;
              break;
            case 'daily':
              key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-${String(attemptDate.getDate()).padStart(2, '0')}`;
              break;
            case 'weekly':
              const weekStart = new Date(attemptDate);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
              break;
            case 'monthly':
              key = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-01`;
              break;
            case 'yearly':
              key = `${attemptDate.getFullYear()}-01-01`;
              break;
          }

          if (!groupedData[key]) {
            groupedData[key] = { followUpCalls: 0, totalCalls: 0 };
          }

          groupedData[key].totalCalls++;
          if (requiresFollowUp) {
            groupedData[key].followUpCalls++;
          }
        }
      }
    });

    // Convert to array and fill missing dates
    const result: FollowUpCallsData[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      let key: string;

      switch (grouping) {
        case 'hourly':
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const hour = String(currentDate.getHours()).padStart(2, '0');
          key = `${year}-${month}-${day}T${hour}:00:00`;
          break;
        case 'daily':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          key = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      const data = groupedData[key] || { followUpCalls: 0, totalCalls: 0 };
      const followUpRate = data.totalCalls > 0 ? Math.round((data.followUpCalls / data.totalCalls) * 100) : 0;

      result.push({
        date: key,
        followUpCalls: data.followUpCalls,
        totalCalls: data.totalCalls,
        followUpRate
      });

      // Increment date
      if (grouping === 'hourly') {
        currentDate.setHours(currentDate.getHours() + 1);
      } else if (grouping === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (grouping === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (grouping === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (grouping === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    // Calculate totals
    const totalFollowUpCalls = result.reduce((sum, item) => sum + item.followUpCalls, 0);
    const totalCalls = result.reduce((sum, item) => sum + item.totalCalls, 0);
    const overallFollowUpRate = totalCalls > 0 ? Math.round((totalFollowUpCalls / totalCalls) * 100) : 0;

    return {
      success: true,
      data: result,
      grouping,
      totals: {
        followUpCalls: totalFollowUpCalls,
        totalCalls,
        followUpRate: overallFollowUpRate
      }
    };
  } catch (error: any) {
    console.error('Error fetching admin follow-up calls data:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch follow-up calls data',
    };
  }
});

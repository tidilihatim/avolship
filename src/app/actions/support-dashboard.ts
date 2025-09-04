'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import { Ticket } from '@/lib/db/models/ticket';
import { TicketMessage } from '@/lib/db/models/ticket-message';

export interface SupportDashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  unassignedTickets: number;
  criticalTickets: number;
  averageResolutionTime: number;
  resolutionRate: number;
  totalMessages: number;
  responseRate: number;
  pendingTickets: number;
}

export interface TicketStatusChart {
  status: string;
  count: number;
  percentage: number;
}

export interface TicketPriorityChart {
  priority: string;
  count: number;
  percentage: number;
}

export interface TicketCategoryChart {
  category: string;
  count: number;
  percentage: number;
}

export interface VolumeChart {
  date: string;
  created: number;
  resolved: number;
  pending: number;
}

export interface AgentPerformanceChart {
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
}

export interface ResolutionTimeChart {
  timeRange: string;
  count: number;
  percentage: number;
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

export const getSupportDashboardStats = withDbConnection(async (startDate?: string, endDate?: string): Promise<{
  success: boolean;
  message?: string;
  data?: SupportDashboardStats;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.SUPPORT, UserRole.ADMIN].includes(user.role)) {
      return { success: false, message: 'Unauthorized. Support access required.' };
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

    // Parallel queries for performance
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      unassignedTickets,
      criticalTickets,
      resolvedWithTimes,
      totalMessages,
      pendingTickets
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in_progress' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.countDocuments({ status: 'closed' }),
      Ticket.countDocuments({ assignedTo: { $exists: false } }),
      Ticket.countDocuments({ priority: 'critical' }),
      Ticket.find({ 
        status: { $in: ['resolved', 'closed'] },
        closedAt: { $exists: true }
      }).select('createdAt closedAt').lean(),
      TicketMessage.countDocuments(),
      Ticket.countDocuments({ 
        status: { $in: ['open', 'assigned'] },
        createdAt: { $gte: fromDate, $lte: toDate }
      })
    ]);

    // Calculate average resolution time
    let averageResolutionTime = 0;
    if (resolvedWithTimes.length > 0) {
      const totalTime = resolvedWithTimes.reduce((sum, ticket) => {
        if (ticket.closedAt && ticket.createdAt) {
          return sum + (new Date(ticket.closedAt).getTime() - new Date(ticket.createdAt).getTime());
        }
        return sum;
      }, 0);
      averageResolutionTime = Math.round(totalTime / resolvedWithTimes.length / (1000 * 60 * 60)); // Hours
    }

    // Calculate resolution rate
    const resolutionRate = totalTickets > 0 ? 
      Math.round(((resolvedTickets + closedTickets) / totalTickets) * 100) : 0;

    // Calculate response rate (tickets with at least one message)
    const ticketsWithMessages = await TicketMessage.distinct('ticketId');
    const responseRate = totalTickets > 0 ? 
      Math.round((ticketsWithMessages.length / totalTickets) * 100) : 0;

    const stats: SupportDashboardStats = {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      unassignedTickets,
      criticalTickets,
      averageResolutionTime,
      resolutionRate,
      totalMessages,
      responseRate,
      pendingTickets
    };

    return { success: true, data: stats };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch support dashboard stats'
    };
  }
});

export const getTicketStatusChart = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: TicketStatusChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.SUPPORT, UserRole.ADMIN].includes(user.role)) {
      return { success: false, message: 'Unauthorized. Support access required.' };
    }

    const statusCounts = await Ticket.aggregate([
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

    const totalTickets = statusCounts.reduce((sum, item) => sum + item.count, 0);

    const data: TicketStatusChart[] = statusCounts.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalTickets > 0 ? Math.round((item.count / totalTickets) * 100) : 0
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch ticket status chart data'
    };
  }
});

export const getTicketPriorityChart = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: TicketPriorityChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.SUPPORT, UserRole.ADMIN].includes(user.role)) {
      return { success: false, message: 'Unauthorized. Support access required.' };
    }

    const priorityCounts = await Ticket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { 
          _id: 1  // Sort by priority: low, medium, high, critical
        }
      }
    ]);

    const totalTickets = priorityCounts.reduce((sum, item) => sum + item.count, 0);

    const data: TicketPriorityChart[] = priorityCounts.map(item => ({
      priority: item._id,
      count: item.count,
      percentage: totalTickets > 0 ? Math.round((item.count / totalTickets) * 100) : 0
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch ticket priority chart data'
    };
  }
});

export const getTicketCategoryChart = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: TicketCategoryChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.SUPPORT, UserRole.ADMIN].includes(user.role)) {
      return { success: false, message: 'Unauthorized. Support access required.' };
    }

    const categoryCounts = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalTickets = categoryCounts.reduce((sum, item) => sum + item.count, 0);

    const data: TicketCategoryChart[] = categoryCounts.map(item => ({
      category: item._id,
      count: item.count,
      percentage: totalTickets > 0 ? Math.round((item.count / totalTickets) * 100) : 0
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch ticket category chart data'
    };
  }
});

export const getVolumeChart = withDbConnection(async (startDate?: string, endDate?: string): Promise<{
  success: boolean;
  message?: string;
  data?: VolumeChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.SUPPORT, UserRole.ADMIN].includes(user.role)) {
      return { success: false, message: 'Unauthorized. Support access required.' };
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

    const tickets = await Ticket.find({
      createdAt: { $gte: fromDate, $lte: toDate }
    }).select('createdAt status closedAt').lean();

    // Group by date
    const dailyData: { [key: string]: { created: number, resolved: number, pending: number } } = {};

    tickets.forEach(ticket => {
      const dateStr = new Date(ticket.createdAt).toISOString().slice(0, 10);
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { created: 0, resolved: 0, pending: 0 };
      }
      dailyData[dateStr].created++;
      
      if (ticket.closedAt) {
        const closedDateStr = new Date(ticket.closedAt).toISOString().slice(0, 10);
        if (dailyData[closedDateStr]) {
          dailyData[closedDateStr].resolved++;
        }
      }
    });

    // Calculate pending (cumulative)
    let cumulativePending = 0;
    const result: VolumeChart[] = [];
    const currentDate = new Date(fromDate);
    
    while (currentDate <= toDate) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const data = dailyData[dateStr] || { created: 0, resolved: 0, pending: 0 };
      cumulativePending += data.created - data.resolved;
      
      result.push({
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created: data.created,
        resolved: data.resolved,
        pending: Math.max(0, cumulativePending)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch volume chart data'
    };
  }
});

export const getAgentPerformanceChart = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: AgentPerformanceChart[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.SUPPORT, UserRole.ADMIN].includes(user.role)) {
      return { success: false, message: 'Unauthorized. Support access required.' };
    }

    const agentStats = await Ticket.aggregate([
      {
        $match: {
          assignedTo: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'agent'
        }
      },
      {
        $unwind: '$agent'
      },
      {
        $group: {
          _id: '$assignedTo',
          agentName: { $first: '$agent.name' },
          assignedTickets: { $sum: 1 },
          resolvedTickets: {
            $sum: {
              $cond: [
                { $in: ['$status', ['resolved', 'closed']] },
                1,
                0
              ]
            }
          },
          totalResolutionTime: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $ne: ['$closedAt', null] },
                    { $in: ['$status', ['resolved', 'closed']] }
                  ]
                },
                { $subtract: ['$closedAt', '$createdAt'] },
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          averageResolutionTime: {
            $cond: [
              { $gt: ['$resolvedTickets', 0] },
              { $divide: ['$totalResolutionTime', '$resolvedTickets'] },
              0
            ]
          }
        }
      },
      {
        $sort: { assignedTickets: -1 }
      }
    ]);

    const data: AgentPerformanceChart[] = agentStats.map(agent => ({
      agentName: agent.agentName || 'Unknown',
      assignedTickets: agent.assignedTickets,
      resolvedTickets: agent.resolvedTickets,
      averageResolutionTime: Math.round(agent.averageResolutionTime / (1000 * 60 * 60)) // Convert to hours
    }));

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch agent performance chart data'
    };
  }
});

export const getRecentTickets = withDbConnection(async (limit: number = 10): Promise<{
  success: boolean;
  message?: string;
  data?: any[];
}> => {
  try {
    const user = await getCurrentUser();
    if (!user || ![UserRole.SUPPORT, UserRole.ADMIN].includes(user.role)) {
      return { success: false, message: 'Unauthorized. Support access required.' };
    }

    const recentTickets = await Ticket.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title category priority status createdAt assignedTo createdBy')
      .lean();

    const activities = recentTickets.map((ticket: any) => ({
      type: 'ticket',
      id: ticket._id.toString(),
      title: ticket.title,
      description: `${ticket.category} • ${ticket.priority} priority`,
      date: ticket.createdAt,
      status: ticket.status,
      assignedTo: ticket.assignedTo?.name,
      createdBy: ticket.createdBy?.name
    }));

    return { success: true, data: activities };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch recent tickets'
    };
  }
});
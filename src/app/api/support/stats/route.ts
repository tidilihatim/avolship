import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SupportTicket from '@/lib/db/models/support-ticket';
import SupportChatRoom from '@/lib/db/models/support-chat-room';

const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_CUSTOMER: 'waiting_customer',
  WAITING_INTERNAL: 'waiting_internal',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const ChatRoomStatus = {
  ACTIVE: 'active',
  WAITING: 'waiting',
  PAUSED: 'paused',
  CLOSED: 'closed',
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(period));

    const query: any = { createdAt: { $gte: dateFrom } };

    // Role-based filtering
    if (session.user.role === 'seller' || session.user.role === 'provider') {
      query.customerId = session.user.id;
    } else if (session.user.role === 'support') {
      query.assignedAgentId = session.user.id;
    }

    // Get ticket statistics
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      highPriorityTickets,
      averageResolutionTime,
      ticketsByCategory,
      recentTickets
    ] = await Promise.all([
      // Total tickets
      SupportTicket.countDocuments(query),
      
      // Open tickets
      SupportTicket.countDocuments({ ...query, status: TicketStatus.OPEN }),
      
      // In progress tickets
      SupportTicket.countDocuments({ ...query, status: TicketStatus.IN_PROGRESS }),
      
      // Resolved tickets
      SupportTicket.countDocuments({ ...query, status: TicketStatus.RESOLVED }),
      
      // Closed tickets
      SupportTicket.countDocuments({ ...query, status: TicketStatus.CLOSED }),
      
      // Critical tickets
      SupportTicket.countDocuments({ ...query, priority: TicketPriority.CRITICAL }),
      
      // High priority tickets
      SupportTicket.countDocuments({ ...query, priority: TicketPriority.HIGH }),
      
      // Average resolution time
      SupportTicket.aggregate([
        { $match: { ...query, 'sla.resolutionDuration': { $exists: true } } },
        { $group: { _id: null, avgResolution: { $avg: '$sla.resolutionDuration' } } }
      ]),
      
      // Tickets by category
      SupportTicket.aggregate([
        { $match: query },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Recent tickets
      SupportTicket.find(query)
        .populate('customerId', 'name email')
        .populate('assignedAgentId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    // Get chat statistics if user has access
    let chatStats = null;
    if (['admin', 'support'].includes(session.user.role)) {
      const chatQuery: any = { sessionStartedAt: { $gte: dateFrom } };
      if (session.user.role === 'support') {
        chatQuery.assignedAgentId = session.user.id;
      }

      const [activeChatRooms, totalChatSessions] = await Promise.all([
        SupportChatRoom.countDocuments({ ...chatQuery, status: ChatRoomStatus.ACTIVE }),
        SupportChatRoom.countDocuments(chatQuery)
      ]);

      chatStats = {
        activeChatRooms,
        totalChatSessions
      };
    }

    // Calculate response rate
    const responseRate = totalTickets > 0 ? 
      ((resolvedTickets + closedTickets) / totalTickets * 100).toFixed(1) : '0';

    // Format average resolution time
    const avgResolutionMinutes = averageResolutionTime[0]?.avgResolution || 0;
    const avgResolutionHours = (avgResolutionMinutes / 60).toFixed(1);

    const stats = {
      overview: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        responseRate: parseFloat(responseRate),
        averageResolutionTime: parseFloat(avgResolutionHours),
        criticalTickets,
        highPriorityTickets
      },
      categoryBreakdown: ticketsByCategory.map(item => ({
        category: item._id,
        count: item.count,
        percentage: totalTickets > 0 ? ((item.count / totalTickets) * 100).toFixed(1) : '0'
      })),
      recentActivity: recentTickets,
      ...(chatStats && { chatStats })
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching support statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
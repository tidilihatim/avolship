import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import User from '@/lib/db/models/user';
import SupportTicket from '@/lib/db/models/support-ticket';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access this
    if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    // Find all support agents
    const supportAgents = await User.find({ 
      role: { $in: ['support', 'SUPPORT'] } 
    }).select('name email status createdAt').lean();

    // Get statistics for each agent
    const agentsWithStats = await Promise.all(
      supportAgents.map(async (agent) => {
        const [assignedTickets, resolvedTickets, avgResponseTime] = await Promise.all([
          SupportTicket.countDocuments({ assignedAgentId: agent._id }),
          SupportTicket.countDocuments({ 
            assignedAgentId: agent._id, 
            status: { $in: ['resolved', 'closed'] } 
          }),
          SupportTicket.aggregate([
            { 
              $match: { 
                assignedAgentId: agent._id,
                'sla.responseTime': { $exists: true }
              } 
            },
            { 
              $group: { 
                _id: null, 
                avgTime: { $avg: '$sla.responseTime' } 
              } 
            }
          ])
        ]);

        return {
          _id: agent._id,
          name: agent.name,
          email: agent.email,
          status: agent.status || 'active',
          assignedTickets,
          resolvedTickets,
          averageResponseTime: Math.round(avgResponseTime[0]?.avgTime || 0),
          specializations: [] // To be implemented with agent preferences
        };
      })
    );

    return NextResponse.json({
      success: true,
      agents: agentsWithStats
    });

  } catch (error) {
    console.error('Error fetching support agents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
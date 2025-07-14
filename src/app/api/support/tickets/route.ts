import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SupportTicket from '@/lib/db/models/support-ticket';
import User from '@/lib/db/models/user';

// Define enums to match the model
const TicketCategory = {
  TECHNICAL: 'technical',
  BILLING: 'billing',
  ACCOUNT: 'account',
  ORDERS: 'orders',
  SOURCING: 'sourcing',
  EXPEDITIONS: 'expeditions',
  INTEGRATIONS: 'integrations',
  GENERAL: 'general',
};

const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_CUSTOMER: 'waiting_customer',
  WAITING_INTERNAL: 'waiting_internal',
  RESOLVED: 'resolved',
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
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const assignedAgent = searchParams.get('assignedAgent');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: any = {};

    // Role-based filtering
    if (session.user.role === 'seller' || session.user.role === 'provider') {
      query.customerId = session.user.id;
    } else if (session.user.role === 'support') {
      // Support agents can see all tickets or filter by assigned agent
      if (assignedAgent && assignedAgent !== 'all') {
        query.assignedAgentId = assignedAgent;
      }
      // If no assignedAgent specified, show all tickets for support dashboard
    }

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [tickets, totalCount] = await Promise.all([
      SupportTicket.find(query)
        .populate('customerId', 'name email')
        .populate('assignedAgentId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    // Only sellers and providers can create tickets
    const userRole = session.user.role || '';
    
    if (!['seller', 'provider'].includes(userRole)) {
      return NextResponse.json({ 
        error: `Forbidden - only sellers and providers can create tickets`, 
        details: {
          yourRole: userRole,
          allowedRoles: ['seller', 'provider']
        }
      }, { status: 403 });
    }

    await connectToDatabase();

    const body = await req.json();
    
    const {
      subject,
      description,
      category,
      priority = 'medium',
      attachments = [],
      tags = [],
      relatedOrderId,
      relatedSourcingRequestId
    } = body;

    // Validate required fields
    if (!subject || !description || !category) {
      return NextResponse.json({ 
        error: 'Subject, description, and category are required',
        receivedFields: {
          hasSubject: !!subject,
          hasDescription: !!description,
          hasCategory: !!category,
          category: category
        }
      }, { status: 400 });
    }


    // Validate category
    if (!Object.values(TicketCategory).includes(category)) {
      return NextResponse.json({ 
        error: `Invalid category`, 
        details: {
          receivedCategory: category,
          validCategories: Object.values(TicketCategory)
        }
      }, { status: 400 });
    }

    // Validate priority
    if (!Object.values(TicketPriority).includes(priority)) {
      return NextResponse.json({ 
        error: `Invalid priority`, 
        details: {
          receivedPriority: priority,
          validPriorities: Object.values(TicketPriority)
        }
      }, { status: 400 });
    }

    // Get SLA targets based on priority and customer type
    const baseSLA = {
      'critical': { response: 15, resolution: 240 }, // 15 min, 4 hours
      'high': { response: 60, resolution: 480 }, // 1 hour, 8 hours
      'medium': { response: 240, resolution: 1440 }, // 4 hours, 24 hours
      'low': { response: 480, resolution: 2880 }, // 8 hours, 48 hours
    };
    
    // Providers get faster SLA for business critical issues
    const multiplier = userRole === 'provider' ? 0.75 : 1;
    
    const slaTargets = {
      responseTimeTarget: Math.floor(baseSLA[priority].response * multiplier),
      resolutionTimeTarget: Math.floor(baseSLA[priority].resolution * multiplier),
      escalationLevel: 0
    };

    // Create the ticket
    // Generate ticket number manually to avoid middleware issues
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    const ticketNumber = `TK-${timestamp}-${randomSuffix}`;

    const ticket = new SupportTicket({
      ticketNumber,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      customerId: session.user.id,
      customerType: userRole as 'seller' | 'provider',
      attachments: attachments || [],
      tags: tags ? tags.map((tag: string) => tag.trim()) : [],
      sla: {
        responseTimeTarget: slaTargets.responseTimeTarget,
        resolutionTimeTarget: slaTargets.resolutionTimeTarget,
        escalationLevel: slaTargets.escalationLevel
      },
      source: 'web',
      ...(relatedOrderId && { relatedOrderId }),
      ...(relatedSourcingRequestId && { relatedSourcingRequestId })
    });

    await ticket.save();

    // Populate customer information
    await ticket.populate('customerId', 'name email');

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Support ticket created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific MongoDB errors
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'A ticket with this number already exists. Please try again.', 
        details: error.message 
      }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((e: any) => e.message).join(', ');
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors,
        fieldErrors: error.errors
      }, { status: 400 });
    }
    
    if (error.name === 'CastError') {
      return NextResponse.json({ 
        error: 'Invalid data format', 
        details: `Invalid ${error.path}: ${error.value}`,
        path: error.path,
        value: error.value
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create support ticket', 
      details: error.message,
      errorName: error.name
    }, { status: 500 });
  }
}
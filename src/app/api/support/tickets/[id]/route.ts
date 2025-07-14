import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SupportTicket from '@/lib/db/models/support-ticket';
import mongoose from 'mongoose';

const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_CUSTOMER: 'waiting_customer',
  WAITING_INTERNAL: 'waiting_internal',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Handle params properly for Next.js 14+
    const resolvedParams = await Promise.resolve(params);
    const ticketId = resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const query: any = { _id: ticketId };

    // Role-based access control
    if (session.user.role === 'seller' || session.user.role === 'provider') {
      query.customerId = session.user.id;
    }

    const ticket = await SupportTicket.findOne(query)
      .populate('customerId', 'name email')
      .populate('assignedAgentId', 'name email')
      .populate('relatedOrderId')
      .populate('relatedSourcingRequestId')
      .populate('chatRoomId')
      .lean();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const resolvedParams = await Promise.resolve(params);
    const ticketId = resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const body = await req.json();
    const allowedUpdates = ['status', 'priority', 'assignedAgentId', 'tags', 'internalNotes'];
    const updates: any = {};

    // Filter allowed updates based on user role
    if (session.user.role === 'support' || session.user.role === 'admin') {
      // Support agents can update everything
      for (const key of allowedUpdates) {
        if (body[key] !== undefined) {
          updates[key] = body[key];
        }
      }
    } else if (session.user.role === 'seller' || session.user.role === 'provider') {
      // Customers can only add tags and close their own tickets
      if (body.tags !== undefined) {
        updates.tags = body.tags;
      }
      if (body.status === TicketStatus.CLOSED) {
        updates.status = TicketStatus.CLOSED;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    const query: any = { _id: ticketId };

    // Role-based access control
    if (session.user.role === 'seller' || session.user.role === 'provider') {
      query.customerId = session.user.id;
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      query,
      updates,
      { new: true, runValidators: true }
    )
      .populate('customerId', 'name email')
      .populate('assignedAgentId', 'name email');

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Ticket updated successfully'
    });

  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete tickets
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const resolvedParams = await Promise.resolve(params);
    const ticketId = resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const ticket = await SupportTicket.findByIdAndDelete(ticketId);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
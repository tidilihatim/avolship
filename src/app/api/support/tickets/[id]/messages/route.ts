import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SupportTicket from '@/lib/db/models/support-ticket';
import SupportChatRoom from '@/lib/db/models/support-chat-room';
import SupportChatMessage from '@/lib/db/models/support-chat-message';
import mongoose from 'mongoose';

const SupportChatType = {
  TICKET_CHAT: 'ticket_chat',
  QUICK_CHAT: 'quick_chat',
};

const ChatRoomStatus = {
  ACTIVE: 'active',
  WAITING: 'waiting',
  PAUSED: 'paused',
  CLOSED: 'closed',
};

const SupportMessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  PDF: 'pdf',
  SYSTEM: 'system',
  CANNED_RESPONSE: 'canned_response',
  INTERNAL_NOTE: 'internal_note',
};

const MessageSenderType = {
  CUSTOMER: 'customer',
  AGENT: 'agent',
  SYSTEM: 'system',
  BOT: 'bot',
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
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

    // Find the ticket and verify access
    const query: any = { _id: ticketId };
    if (session.user.role === 'seller' || session.user.role === 'provider') {
      query.customerId = session.user.id;
    }

    const ticket = await SupportTicket.findOne(query);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Get or create chat room for this ticket
    let chatRoom = await SupportChatRoom.findOne({ ticketId });
    
    if (!chatRoom) {
      // Create a new chat room for this ticket
      chatRoom = new SupportChatRoom({
        type: SupportChatType.TICKET_CHAT,
        ticketId,
        customerId: ticket.customerId,
        status: ChatRoomStatus.ACTIVE,
        participants: [{
          userId: ticket.customerId,
          role: 'customer',
          joinedAt: new Date(),
          isOnline: true,
          isTyping: false
        }],
        customerInfo: {
          name: session.user.name || 'Customer',
          email: session.user.email || '',
          userType: ticket.customerType,
          previousTickets: 0
        },
        source: 'ticket'
      });
      await chatRoom.save();

      // Update ticket with chat room ID
      ticket.chatRoomId = chatRoom._id;
      await ticket.save();
    }

    // Get messages for this chat room
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const messages = await SupportChatMessage.find({ 
      chatRoomId: chatRoom._id,
      isDeleted: false
    })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalMessages = await SupportChatMessage.countDocuments({ 
      chatRoomId: chatRoom._id,
      isDeleted: false 
    });

    return NextResponse.json({
      success: true,
      data: {
        chatRoom,
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalMessages / limit),
          totalCount: totalMessages,
          hasNext: page < Math.ceil(totalMessages / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
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
    const { content, messageType = SupportMessageType.TEXT, attachments = [], isInternal = false } = body;

    if (!content && attachments.length === 0) {
      return NextResponse.json({ 
        error: 'Message content or attachments required' 
      }, { status: 400 });
    }

    // Find the ticket and verify access
    const query: any = { _id: ticketId };
    if (session.user.role === 'seller' || session.user.role === 'provider') {
      query.customerId = session.user.id;
    }

    const ticket = await SupportTicket.findOne(query);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Get or create chat room
    let chatRoom = await SupportChatRoom.findOne({ ticketId });
    if (!chatRoom) {
      chatRoom = new SupportChatRoom({
        type: SupportChatType.TICKET_CHAT,
        ticketId,
        customerId: ticket.customerId,
        status: ChatRoomStatus.ACTIVE,
        participants: [{
          userId: ticket.customerId,
          role: 'customer',
          joinedAt: new Date(),
          isOnline: true,
          isTyping: false
        }],
        customerInfo: {
          name: session.user.name || 'Customer',
          email: session.user.email || '',
          userType: ticket.customerType,
          previousTickets: 0
        },
        source: 'ticket'
      });
      await chatRoom.save();

      ticket.chatRoomId = chatRoom._id;
      await ticket.save();
    }

    // Determine sender type
    let senderType: MessageSenderType;
    if (['support', 'admin'].includes(session.user.role)) {
      senderType = MessageSenderType.AGENT;
    } else {
      senderType = MessageSenderType.CUSTOMER;
    }

    // Create the message
    const message = new SupportChatMessage({
      chatRoomId: chatRoom._id,
      senderId: session.user.id,
      senderType,
      messageType,
      content: content?.trim(),
      attachments,
      isInternal: isInternal && senderType === MessageSenderType.AGENT,
      source: 'dashboard'
    });

    await message.save();
    await message.populate('senderId', 'name email');

    // Update ticket message count and last message time
    await SupportTicket.findByIdAndUpdate(ticketId, {
      $inc: { messageCount: 1 },
      lastMessageAt: new Date()
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending ticket message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
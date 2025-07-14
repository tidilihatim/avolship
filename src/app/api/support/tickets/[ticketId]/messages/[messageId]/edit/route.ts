import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SupportTicket from '@/lib/db/models/support-ticket';
import SupportChatMessage from '@/lib/db/models/support-chat-message';
import mongoose from 'mongoose';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const params = await context.params;
    const { ticketId, messageId } = params;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }
    
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }
    
    // Get request body
    const { content } = await req.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    // Find the ticket first to verify access
    const ticketQuery: any = { _id: ticketId };
    
    // Restrict access for customers to their own tickets
    if (session.user.role === 'seller' || session.user.role === 'provider') {
      ticketQuery.customerId = session.user.id;
    }
    
    const ticket = await SupportTicket.findOne(ticketQuery);
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    
    // Find the message
    const message = await SupportChatMessage.findOne({
      _id: messageId,
      chatRoomId: ticket.chatRoomId,
      isDeleted: false
    });
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Check permissions
    const isMessageOwner = message.senderId.toString() === session.user.id;
    const isSupportAgent = ['support', 'admin', 'moderator'].includes(session.user.role);
    
    if (!isMessageOwner && !isSupportAgent) {
      return NextResponse.json({ 
        error: 'You do not have permission to edit this message' 
      }, { status: 403 });
    }
    
    // Don't allow editing system messages
    if (message.messageType === 'system') {
      return NextResponse.json({ 
        error: 'System messages cannot be edited' 
      }, { status: 400 });
    }
    
    // Don't allow editing internal notes by non-support staff
    if (message.isInternal && !isSupportAgent) {
      return NextResponse.json({ 
        error: 'Internal notes cannot be edited' 
      }, { status: 403 });
    }
    
    // Time restriction for regular users (15 minutes)
    if (!isSupportAgent && isMessageOwner) {
      const messageAge = Date.now() - message.createdAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000;
      
      if (messageAge > fifteenMinutes) {
        return NextResponse.json({ 
          error: 'Messages can only be edited within 15 minutes of sending' 
        }, { status: 400 });
      }
    }
    
    // Store original content if this is the first edit
    if (!message.isEdited) {
      message.originalContent = message.content;
    }
    
    // Update the message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    
    await message.save();
    
    // Populate sender information for response
    await message.populate('senderId', 'name email role');
    
    // Update ticket's last message timestamp
    await SupportTicket.findByIdAndUpdate(ticketId, {
      lastMessageAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      data: {
        _id: message._id,
        chatRoomId: message.chatRoomId,
        senderId: message.senderId,
        senderType: message.senderType,
        messageType: message.messageType,
        content: message.content,
        attachments: message.attachments || [],
        isInternal: message.isInternal,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        originalContent: message.originalContent,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      },
      message: 'Message updated successfully'
    });
    
  } catch (error) {
    console.error('Error editing ticket message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to edit message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Optional: Add PATCH method as an alias for PUT
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string; messageId: string }> }
) {
  return PUT(req, context);
}
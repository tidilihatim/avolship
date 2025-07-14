import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SupportChatMessage from '@/lib/db/models/support-chat-message';
import SupportChatRoom from '@/lib/db/models/support-chat-room';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const params = await context.params;
    const { messageId } = params;
    const { content } = await req.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    // Find the message
    const message = await SupportChatMessage.findById(messageId)
      .populate('chatRoomId');
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Check permissions
    const isMessageOwner = message.senderId.toString() === session.user.id;
    const isSupport = session.user.role === 'support' || session.user.role === 'admin';
    
    if (!isMessageOwner && !isSupport) {
      return NextResponse.json({ error: 'Unauthorized to edit this message' }, { status: 403 });
    }
    
    // Don't allow editing after 15 minutes for regular users
    if (!isSupport && isMessageOwner) {
      const messageAge = Date.now() - message.createdAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000;
      
      if (messageAge > fifteenMinutes) {
        return NextResponse.json({ 
          error: 'Cannot edit message after 15 minutes' 
        }, { status: 400 });
      }
    }
    
    // Store original content if not already edited
    if (!message.isEdited) {
      message.originalContent = message.content;
    }
    
    // Update the message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    
    await message.save();
    
    // Populate and transform for response
    await message.populate('senderId', 'name email role businessName');
    
    const transformedMessage = {
      _id: message._id,
      chatRoom: message.chatRoomId._id,
      sender: message.senderId,
      receiver: message.senderType === 'customer' 
        ? message.chatRoomId.assignedAgentId 
        : message.chatRoomId.customerId,
      messageType: message.messageType,
      content: message.content,
      attachments: message.attachments || [],
      status: 'sent',
      isRead: message.isRead || false,
      readAt: message.readAt,
      reactions: [],
      isPinned: false,
      isEdited: message.isEdited,
      editedAt: message.editedAt,
      replyTo: message.replyToMessageId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
    
    // TODO: Emit socket event for real-time update
    
    return NextResponse.json({
      success: true,
      data: transformedMessage
    });
    
  } catch (error) {
    console.error('Error editing support message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to edit message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
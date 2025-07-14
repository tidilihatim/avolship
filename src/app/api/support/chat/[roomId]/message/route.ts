import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SupportChatRoom from '@/lib/db/models/support-chat-room';
import SupportChatMessage from '@/lib/db/models/support-chat-message';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const params = await context.params;
    const { roomId } = params;
    const body = await req.json();
    const { content, messageType = 'text', replyTo } = body;
    
    console.log('Support message request:', { roomId, content, messageType, userId: session.user.id });
    
    // Find the support chat room
    const chatRoom = await SupportChatRoom.findById(roomId);
    
    if (!chatRoom) {
      console.error('Chat room not found:', roomId);
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }
    
    console.log('Found chat room:', { 
      roomId: chatRoom._id, 
      customerId: chatRoom.customerId,
      assignedAgentId: chatRoom.assignedAgentId,
      status: chatRoom.status 
    });
    
    // Check if user is participant or support agent
    const isParticipant = chatRoom.customerId.toString() === session.user.id;
    const isAgent = chatRoom.assignedAgentId?.toString() === session.user.id || 
                   session.user.role === 'support' || 
                   session.user.role === 'admin';
    
    if (!isParticipant && !isAgent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Determine sender type
    const senderType = (session.user.role === 'support' || session.user.role === 'admin') 
      ? 'agent' 
      : 'customer';
    
    // Create the message
    const message = await SupportChatMessage.create({
      chatRoomId: roomId,
      senderId: session.user.id,
      senderType,
      messageType,
      content,
      replyToMessageId: replyTo, // Fixed field name
      isInternal: false,
      isFirstResponse: !chatRoom.metrics?.agentMessages && senderType === 'agent',
      source: 'dashboard' // Added required field
    });
    
    // Update chat room metrics and last activity
    const updateData: any = {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      'metrics.totalMessages': (chatRoom.metrics?.totalMessages || 0) + 1
    };
    
    if (senderType === 'customer') {
      updateData['metrics.customerMessages'] = (chatRoom.metrics?.customerMessages || 0) + 1;
      updateData.lastCustomerMessageAt = new Date();
    } else {
      updateData['metrics.agentMessages'] = (chatRoom.metrics?.agentMessages || 0) + 1;
      updateData.lastAgentMessageAt = new Date();
      
      // Mark first response time if this is the first agent message
      if (chatRoom.sla && !chatRoom.sla.firstResponseAt) {
        updateData['sla.firstResponseAt'] = new Date();
        updateData['sla.firstResponseDuration'] = Math.floor(
          (Date.now() - chatRoom.createdAt.getTime()) / 60000
        ); // in minutes
      }
    }
    
    // Update status to active if it was waiting
    if (chatRoom.status === 'waiting' && senderType === 'agent') {
      updateData.status = 'active';
    }
    
    await SupportChatRoom.findByIdAndUpdate(roomId, updateData);
    
    // Populate the message before sending
    await message.populate('senderId', 'name email role businessName');
    if (message.replyToMessageId) {
      await message.populate({
        path: 'replyToMessageId',
        select: 'content senderId senderType messageType',
        populate: {
          path: 'senderId',
          select: 'name email'
        }
      });
    }
    
    // Transform to match regular chat message format
    const transformedMessage = {
      _id: message._id,
      chatRoom: message.chatRoomId,
      sender: message.senderId,
      receiver: senderType === 'customer' ? chatRoom.assignedAgentId : chatRoom.customerId,
      messageType: message.messageType,
      content: message.content,
      attachments: message.attachments,
      status: 'sent',
      isRead: false,
      reactions: [],
      isPinned: false,
      isEdited: false,
      replyTo: message.replyToMessageId ? {
        _id: message.replyToMessageId._id,
        content: message.replyToMessageId.content,
        sender: message.replyToMessageId.senderId,
        messageType: message.replyToMessageId.messageType
      } : null,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
    
    // TODO: Emit socket event for real-time updates
    
    return NextResponse.json({
      success: true,
      data: transformedMessage
    });
    
  } catch (error) {
    console.error('Error sending support message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const params = await context.params;
    const { roomId } = params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('Fetching messages for room:', { roomId, page, limit });
    
    // Validate roomId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      console.error('Invalid room ID format:', roomId);
      return NextResponse.json(
        { error: 'Invalid room ID format', details: `Room ID ${roomId} is not a valid ObjectId` }, 
        { status: 400 }
      );
    }
    
    // Find the support chat room
    let chatRoom;
    try {
      chatRoom = await SupportChatRoom.findById(roomId);
    } catch (dbError) {
      console.error('Database error finding chat room:', dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown'}`);
    }
    
    if (!chatRoom) {
      // Check if this might be an old chat room ID
      const ChatRoom = mongoose.models.ChatRoom || mongoose.model('ChatRoom', new mongoose.Schema({
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        isSupport: Boolean,
        lastMessageAt: Date,
        status: String,
        createdAt: Date,
        updatedAt: Date
      }));
      
      const oldChatRoom = await ChatRoom.findById(roomId).populate('participants');
      
      if (oldChatRoom && oldChatRoom.isSupport) {
        // This is an old support chat, create error message with migration info
        console.error(`Old chat room structure detected for ID: ${roomId}`);
        return NextResponse.json({ 
          error: 'This chat uses an old structure. Please run the migration script.',
          details: 'Old support chat detected',
          needsMigration: true 
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }
    
    // Check if user is participant or support agent
    const isParticipant = chatRoom.customerId.toString() === session.user.id;
    const isAgent = chatRoom.assignedAgentId?.toString() === session.user.id || 
                   session.user.role === 'support' || 
                   session.user.role === 'admin';
    
    if (!isParticipant && !isAgent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Fetch messages
    let messages;
    try {
      console.log('Querying messages with params:', { 
        chatRoomId: roomId, 
        isInternal: false,
        limit,
        skip: (page - 1) * limit 
      });
      
      // First try without populate to see if that's the issue
      const basicMessages = await SupportChatMessage.find({
        chatRoomId: roomId,
        isInternal: false // Don't show internal notes to customers
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
      
      console.log(`Found ${basicMessages.length} messages without populate`);
      if (basicMessages.length > 0) {
        console.log('First message sample:', {
          _id: basicMessages[0]._id,
          hasContent: !!basicMessages[0].content,
          senderType: basicMessages[0].senderType,
          source: basicMessages[0].source
        });
      }
      
      // Now try with populate - handle populate errors gracefully
      try {
        messages = await SupportChatMessage.find({
          chatRoomId: roomId,
          isInternal: false // Don't show internal notes to customers
        })
        .populate('senderId', 'name email role businessName')
        .populate({
          path: 'replyToMessageId',
          select: 'content senderId senderType',
          populate: {
            path: 'senderId',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      } catch (popError) {
        console.error('Population error, trying without replyTo populate:', popError);
        // Try without replyTo populate
        messages = await SupportChatMessage.find({
          chatRoomId: roomId,
          isInternal: false // Don't show internal notes to customers
        })
        .populate('senderId', 'name email role businessName')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      }
      
      console.log(`Found ${messages.length} messages for room ${roomId}`);
    } catch (msgError) {
      console.error('Error querying messages:', msgError);
      throw new Error(`Message query error: ${msgError instanceof Error ? msgError.message : 'Unknown'}`);
    }
    
    // Transform messages to match regular chat format
    const transformedMessages = messages.map((message: any) => {
      try {
        return {
          _id: message._id,
          chatRoom: message.chatRoomId,
          sender: message.senderId || message.sender,
          receiver: message.senderType === 'customer' ? chatRoom.assignedAgentId : chatRoom.customerId,
          messageType: message.messageType || 'text',
          content: message.content || '',
          attachments: message.attachments || [],
          status: 'sent',
          isRead: message.isRead || false,
          readAt: message.readAt,
          reactions: [],
          isPinned: false,
          isEdited: message.isEdited || false,
          editedAt: message.editedAt,
          replyTo: message.replyToMessageId ? {
            _id: message.replyToMessageId._id,
            content: message.replyToMessageId.content,
            sender: message.replyToMessageId.senderId,
            messageType: message.replyToMessageId.messageType
          } : null,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        };
      } catch (transformError) {
        console.error('Error transforming message:', message._id, transformError);
        // Return a minimal valid message
        return {
          _id: message._id,
          chatRoom: roomId,
          sender: message.senderId,
          receiver: null,
          messageType: 'text',
          content: message.content || '[Error loading message]',
          attachments: [],
          status: 'sent',
          isRead: false,
          reactions: [],
          isPinned: false,
          isEdited: false,
          replyTo: null,
          createdAt: message.createdAt || new Date(),
          updatedAt: message.updatedAt || new Date()
        };
      }
    }).reverse(); // Reverse to show oldest first
    
    return NextResponse.json({
      success: true,
      data: transformedMessages
    });
    
  } catch (error) {
    console.error('Error fetching support messages:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      roomId: params?.roomId
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
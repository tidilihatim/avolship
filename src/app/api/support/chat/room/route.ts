import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SupportChatRoom, { SupportChatType, ChatRoomStatus } from '@/lib/db/models/support-chat-room';
import User from '@/lib/db/models/user';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Only support agents can create support chat rooms
    if (session.user.role !== 'support' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await connectToDatabase();
    
    const body = await req.json();
    const { customerId } = body;
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }
    
    // Get customer details
    const customer = await User.findById(customerId).select('name email role businessName');
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Check if there's already an active chat room with this customer
    let chatRoom = await SupportChatRoom.findOne({
      customerId,
      status: { $in: [ChatRoomStatus.ACTIVE, ChatRoomStatus.WAITING] },
      type: SupportChatType.QUICK_CHAT
    }).populate('customerId assignedAgentId', 'name email role businessName');
    
    if (!chatRoom) {
      // Create new support chat room with all required fields
      chatRoom = await SupportChatRoom.create({
        type: SupportChatType.QUICK_CHAT,
        status: ChatRoomStatus.ACTIVE,
        customerId,
        assignedAgentId: session.user.id,
        participants: [
          {
            userId: customerId,
            role: 'customer',
            joinedAt: new Date(),
            isOnline: true
          },
          {
            userId: session.user.id,
            role: 'agent',
            joinedAt: new Date(),
            isOnline: true
          }
        ],
        priority: 'medium',
        source: 'dashboard',
        customerInfo: {
          name: customer.businessName || customer.name,
          email: customer.email,
          userType: customer.role.toLowerCase() as 'seller' | 'provider',
          previousTickets: 0 // You can calculate this from support tickets
        },
        metrics: {
          totalMessages: 0,
          customerMessages: 0,
          agentMessages: 0,
          averageResponseTime: 0,
          transferCount: 0,
          escalationCount: 0
        },
        sla: {
          responseTimeTarget: 30, // 30 minutes default
          resolutionTimeTarget: 1440, // 24 hours default
          escalationLevel: 0
        }
      });
      
      // Populate the created chat room
      await chatRoom.populate('customerId assignedAgentId', 'name email role businessName');
    } else {
      // If chat exists but not assigned, assign to current agent
      if (!chatRoom.assignedAgentId) {
        chatRoom.assignedAgentId = session.user.id;
        chatRoom.status = ChatRoomStatus.ACTIVE;
        
        // Add agent to participants if not already there
        const agentParticipant = chatRoom.participants.find(
          p => p.userId.toString() === session.user.id
        );
        
        if (!agentParticipant) {
          chatRoom.participants.push({
            userId: session.user.id,
            role: 'agent',
            joinedAt: new Date(),
            isOnline: true
          });
        }
        
        await chatRoom.save();
      }
    }
    
    // Transform to match the expected format for chat UI
    const transformedChatRoom = {
      _id: chatRoom._id.toString(), // Ensure ID is a string
      seller: chatRoom.customerInfo.userType === 'seller' ? chatRoom.customerId : null,
      provider: chatRoom.customerInfo.userType === 'provider' ? chatRoom.customerId : null,
      isActive: chatRoom.status === ChatRoomStatus.ACTIVE,
      lastMessage: chatRoom.lastMessage,
      lastActivity: chatRoom.lastMessageAt,
      createdAt: chatRoom.createdAt,
      updatedAt: chatRoom.updatedAt,
      // Include the populated customer data
      [chatRoom.customerInfo.userType]: chatRoom.customerId
    };
    
    console.log('Created/found support chat room:', {
      supportRoomId: chatRoom._id.toString(),
      customerId: chatRoom.customerId,
      customerType: chatRoom.customerInfo.userType,
      assignedAgent: chatRoom.assignedAgentId
    });
    
    return NextResponse.json({
      success: true,
      data: transformedChatRoom
    });
    
  } catch (error) {
    console.error('Error creating support chat room:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Only support agents can view support chat rooms
    if (session.user.role !== 'SUPPORT' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await connectToDatabase();
    
    // Get all active chat rooms for the support agent
    const chatRooms = await SupportChatRoom.find({
      $or: [
        { assignedAgentId: session.user.id },
        { status: ChatRoomStatus.WAITING }
      ],
      status: { $ne: ChatRoomStatus.CLOSED }
    })
    .populate('customerId', 'name email role businessName')
    .sort({ lastMessageAt: -1 });
    
    // Transform to match expected format
    const transformedRooms = chatRooms.map(room => ({
      _id: room._id,
      seller: room.customerInfo.userType === 'seller' ? room.customerId : null,
      provider: room.customerInfo.userType === 'provider' ? room.customerId : null,
      isActive: room.status === ChatRoomStatus.ACTIVE,
      lastMessage: room.lastMessage,
      lastActivity: room.lastMessageAt,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      // Include the populated customer data
      [room.customerInfo.userType]: room.customerId
    }));
    
    return NextResponse.json({
      success: true,
      data: transformedRooms
    });
    
  } catch (error) {
    console.error('Error fetching support chat rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db/mongoose';
import ChatRoom from '@/lib/db/models/chat-room';
import ChatMessage from '@/lib/db/models/chat-message';
import User, { UserRole } from '@/lib/db/models/user';
import { ChatRoom as ChatRoomType, ChatMessage as ChatMessageType } from '@/types/chat';

export async function getUserChatRooms(userId: string): Promise<{ success: boolean; data?: ChatRoomType[]; error?: string }> {
  try {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    let query = {};
    if (user.role === UserRole.SELLER) {
      query = { seller: userId };
    } else if (user.role === UserRole.PROVIDER) {
      query = { provider: userId };
    } else {
      return { success: false, error: 'Invalid user role for chat' };
    }

    const chatRooms = await ChatRoom.find(query)
      .populate('seller provider', 'name email businessName')
      .populate('lastMessage')
      .sort({ lastActivity: -1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(chatRooms)) as ChatRoomType[] };
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return { success: false, error: 'Failed to fetch chat rooms' };
  }
}

export async function createOrGetChatRoom(sellerId: string, providerId: string): Promise<{ success: boolean; data?: ChatRoomType; error?: string }> {
  try {
    await connectToDatabase();

    // Validate users exist and have correct roles
    const [seller, provider] = await Promise.all([
      User.findById(sellerId),
      User.findById(providerId)
    ]);

    if (!seller || seller.role !== UserRole.SELLER) {
      return { success: false, error: 'Invalid seller' };
    }

    if (!provider || provider.role !== UserRole.PROVIDER) {
      return { success: false, error: 'Invalid provider' };
    }

    // Find existing chat room or create new one
    let chatRoom = await ChatRoom.findOne({
      seller: sellerId,
      provider: providerId
    }).populate('seller provider', 'name email businessName');

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        seller: sellerId,
        provider: providerId,
        lastActivity: new Date()
      });
      await chatRoom.save();
      await chatRoom.populate('seller provider', 'name email businessName');
    }

    return { success: true, data: JSON.parse(JSON.stringify(chatRoom.toObject())) as ChatRoomType };
  } catch (error) {
    console.error('Error creating/getting chat room:', error);
    return { success: false, error: 'Failed to create chat room' };
  }
}

export async function getChatHistory(chatRoomId: string, userId: string, page: number = 1, limit: number = 50): Promise<{ success: boolean; data?: ChatMessageType[]; error?: string }> {
  try {
    await connectToDatabase();

    // Validate user is participant
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return { success: false, error: 'Chat room not found' };
    }

    const isParticipant = chatRoom.seller.toString() === userId || chatRoom.provider.toString() === userId;
    if (!isParticipant) {
      return { success: false, error: 'User is not a participant in this chat room' };
    }

    const skip = (page - 1) * limit;
    const messages = await ChatMessage.find({ chatRoom: chatRoomId })
      .populate('sender', 'name email businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(messages.reverse())) as ChatMessageType[] };
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return { success: false, error: 'Failed to fetch chat history' };
  }
}

export async function getUsers(role: UserRole, status: string = 'approved'): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    await connectToDatabase();

    const users = await User.find({
      role,
      status,
    }).select('name email businessName role lastActive').lean();

    return { success: true, data: JSON.parse(JSON.stringify(users))};
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

export async function markChatRoomAsRead(chatRoomId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();

    // Mark all unread messages in the chat room as read for this user
    await ChatMessage.updateMany(
      {
        chatRoom: chatRoomId,
        sender: { $ne: userId },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    revalidatePath('/dashboard/seller/chat');
    revalidatePath('/dashboard/provider/chat');

    return { success: true };
  } catch (error) {
    console.error('Error marking chat room as read:', error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
}
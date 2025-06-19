'use client';

import { useState, useEffect } from 'react';
import { ChatLayout } from './chat-layout';
import { ChatRoom } from '@/types/chat';
import { getUserChatRooms } from '@/app/actions/chat';
import { toast } from 'sonner';

interface ChatClientProps {
  userRole: 'seller' | 'provider';
  userId: string;
  initialChatRooms: ChatRoom[];
}

export function ChatClient({ userRole, userId, initialChatRooms }: ChatClientProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(initialChatRooms);
  const [loading, setLoading] = useState(false);

  const refreshChatRooms = async () => {
    setLoading(true);
    try {
      const result = await getUserChatRooms(userId);
      if (result.success && result.data) {
        setChatRooms(result.data);
      } else {
        toast.error(result.error || 'Failed to refresh chat rooms');
      }
    } catch (error) {
      console.error('Failed to refresh chat rooms:', error);
      toast.error('Failed to refresh chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const markChatRoomAsRead = (chatRoomId: string) => {
    setChatRooms(prevRooms => 
      prevRooms.map(room => {
        if (room._id === chatRoomId && room.lastMessage) {
          return {
            ...room,
            lastMessage: {
              ...room.lastMessage,
              isRead: true,
              readAt: new Date()
            }
          };
        }
        return room;
      })
    );
  };

  return (
    <ChatLayout
      userRole={userRole}
      userId={userId}
      chatRooms={chatRooms}
      onRefresh={refreshChatRooms}
      onMarkAsRead={markChatRoomAsRead}
    />
  );
}
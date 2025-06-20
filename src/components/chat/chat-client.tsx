'use client';

import { useState, useEffect } from 'react';
import { ChatLayout } from './chat-layout';
import { ChatRoom, ChatMessage } from '@/types/chat';
import { getUserChatRooms } from '@/app/actions/chat';
import { useSocket } from '@/lib/socket/use-socket';
import { toast } from 'sonner';

interface ChatClientProps {
  userRole: 'seller' | 'provider';
  userId: string;
  initialChatRooms: ChatRoom[];
}

export function ChatClient({ userRole, userId, initialChatRooms }: ChatClientProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(initialChatRooms);
  const [loading, setLoading] = useState(false);
  const { socket, isConnected, on } = useSocket();

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

  // Update chat room list when new messages arrive
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      setChatRooms(prevRooms => {
        const existingRoom = prevRooms.find(room => room._id === message.chatRoom);
        
        if (existingRoom) {
          // Update existing room
          return prevRooms.map(room => {
            if (room._id === message.chatRoom) {
              return {
                ...room,
                lastMessage: message,
                lastActivity: new Date(message.createdAt)
              };
            }
            return room;
          }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        } else {
          // New chat room - refresh the entire list to get the new room
          refreshChatRooms();
          return prevRooms;
        }
      });
    };

    const handleSentMessage = (message: ChatMessage) => {
      setChatRooms(prevRooms => {
        return prevRooms.map(room => {
          if (room._id === message.chatRoom) {
            return {
              ...room,
              lastMessage: message,
              lastActivity: new Date(message.createdAt)
            };
          }
          return room;
        }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
      });
    };

    // Listen for new messages from other users
    const newMessageCleanup = on('message:new', handleNewMessage);
    // Listen for messages sent by current user (to update lastMessage)
    const sentMessageCleanup = on('message:sent', handleSentMessage);

    return () => {
      newMessageCleanup();
      sentMessageCleanup();
    };
  }, [socket, on]);

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
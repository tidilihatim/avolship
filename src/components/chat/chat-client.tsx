'use client';

import { useState, useEffect } from 'react';
import { ChatLayout } from './chat-layout';
import { ChatRoom, ChatMessage } from '@/types/chat';
import { getUserChatRooms } from '@/app/actions/chat';
import { useSocket } from '@/lib/socket/use-socket';
import { toast } from 'sonner';
import { getAccessToken } from '@/app/actions/cookie';

interface ChatClientProps {
  userRole: 'seller' | 'provider' | 'support';
  userId: string;
  initialChatRooms?: ChatRoom[];
  autoStartWithProviderId?: string;
}

export function ChatClient({ userRole, userId, initialChatRooms = [], autoStartWithProviderId }: ChatClientProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(initialChatRooms);
  const [loading, setLoading] = useState(false);
  const [autoSelectedChatRoom, setAutoSelectedChatRoom] = useState<ChatRoom | null>(null);
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

  // Auto-start chat with provider if specified in query params
  useEffect(() => {
    const autoStartChat = async () => {
      if (!autoStartWithProviderId || autoSelectedChatRoom) return;

      try {
        setLoading(true);
        
        // First check if a chat room already exists
        const existingRoom = chatRooms.find(room => 
          (userRole === 'seller' && room.provider._id === autoStartWithProviderId) ||
          (userRole === 'provider' && room.seller._id === autoStartWithProviderId)
        );

        if (existingRoom) {
          setAutoSelectedChatRoom(existingRoom);
          return;
        }

        // Create new chat room
        const sellerId = userRole === 'seller' ? userId : autoStartWithProviderId;
        const providerId = userRole === 'seller' ? autoStartWithProviderId : userId;

        const jwtToken = await getAccessToken();
        if (!jwtToken) {
          return toast.error("Configuration Error")
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/chat/room`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "authorization": `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            sellerId,
            providerId,
          }),
        });

        if (response.ok) {
          const { data: chatRoom } = await response.json();
          setAutoSelectedChatRoom(chatRoom);
          
          // Add the new chat room to the list if it's not already there
          setChatRooms(prevRooms => {
            const roomExists = prevRooms.some(room => room._id === chatRoom._id);
            if (!roomExists) {
              return [chatRoom, ...prevRooms];
            }
            return prevRooms;
          });
          
          toast.success('Chat started successfully');
        } else {
          throw new Error('Failed to create chat room');
        }
      } catch (error) {
        console.error('Failed to auto-start chat:', error);
        toast.error('Failed to start chat with provider');
      } finally {
        setLoading(false);
      }
    };

    autoStartChat();
  }, [autoStartWithProviderId, chatRooms, userId, userRole, autoSelectedChatRoom]);

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
      initialSelectedChatRoom={autoSelectedChatRoom}
    />
  );
}
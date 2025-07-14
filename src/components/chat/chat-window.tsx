'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChatRoom, ChatMessage, ChatUser } from '@/types/chat';
import { ModernMessagesList, ModernMessagesListRef } from './modern-messages-list';
import { ModernMessageInput } from './modern-message-input';
import { useSocket } from '@/lib/socket/use-socket';
import { getChatHistory, markChatRoomAsRead } from '@/app/actions/chat';
import { MessageType } from '@/lib/db/models/chat-message';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

interface ChatWindowProps {
  chatRoom: ChatRoom | null;
  userId: string;
  userRole: 'seller' | 'provider' | 'support';
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onMarkAsRead?: (chatRoomId: string) => void;
}

export function ChatWindow({
  chatRoom,
  userId,
  userRole,
  onToggleSidebar,
  isSidebarOpen,
  onMarkAsRead
}: ChatWindowProps) {
  const t = useTranslations('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const messagesListRef = useRef<ModernMessagesListRef>(null);
  const currentChatRoomId = useRef<string | null>(null);
  const shouldScrollToBottom = useRef<boolean>(false);
  const { socket, isConnected, on, emit } = useSocket();
  

  const otherUser = chatRoom && (
    userRole === 'seller' ? chatRoom.provider : 
    userRole === 'provider' ? chatRoom.seller :
    // For support, show the non-support user (could be either seller or provider)
    chatRoom.seller || chatRoom.provider
  );

  useEffect(() => {
    if (chatRoom && socket) {
      loadChatHistory();
      joinChatRoom();
      checkUserOnlineStatus();
    }

    return () => {
      if (chatRoom && emit) {
        emit('chat:leave', { chatRoomId: chatRoom._id });
      }
    };
  }, [chatRoom, emit]);

  // Track when a new chat room is selected and mark for scrolling
  useEffect(() => {
    if (chatRoom && chatRoom._id !== currentChatRoomId.current) {
      // This is a new chat room
      currentChatRoomId.current = chatRoom._id;
      shouldScrollToBottom.current = true; // Flag that we should scroll for this room
    }
  }, [chatRoom?._id]);

  // Scroll to bottom ONLY if we flagged it (new room) and messages are loaded
  useEffect(() => {
    if (shouldScrollToBottom.current && chatRoom && messages.length > 0 && !loading && !loadingMore) {
      shouldScrollToBottom.current = false; // Reset flag so we don't scroll again
      setTimeout(() => {
        messagesListRef.current?.scrollToBottom();
      }, 300);
    }
  }, [messages.length, loading, loadingMore]);

  useEffect(() => {
    if (!socket) return;

    const newMessageCleanup = on('message:new', handleNewMessage);
    const sentMessageCleanup = on('message:sent', handleMessageSent);
    const readMessageCleanup = on('message:read', handleMessageRead);
    const typingCleanup = on('chat:typing', handleTyping);
    
    // Listen for user online/offline status
    const userOnlineCleanup = on('user:online', (data: { userId: string }) => {
      if (otherUser && data.userId === otherUser._id) {
        setOtherUserOnline(true);
      }
    });
    
    const userOfflineCleanup = on('user:offline', (data: { userId: string }) => {
      if (otherUser && data.userId === otherUser._id) {
        setOtherUserOnline(false);
      }
    });
    
    // Listen for online status check response
    const onlineStatusCleanup = on('user:online-status', (data: { userId: string, isOnline: boolean }) => {
      if (otherUser && data.userId === otherUser._id) {
        setOtherUserOnline(data.isOnline);
      }
    });

    return () => {
      newMessageCleanup();
      sentMessageCleanup();
      readMessageCleanup();
      typingCleanup();
      userOnlineCleanup();
      userOfflineCleanup();
      onlineStatusCleanup();
    };
  }, [socket, on, otherUser]);


  const loadChatHistory = async (page = 1, isLoadingMore = false) => {
    if (!chatRoom) return;

    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      // Reset pagination state for new chat room
      setCurrentPage(1);
      setHasMoreMessages(true);
      setMessages([]);
    }

    try {
      let result;
      
      if (userRole === 'support') {
        // For support chats, use the support endpoint
        const response = await fetch(`/api/support/chat/${chatRoom._id}/message?page=${page}&limit=20`);
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to load support chat messages:', data);
          console.error('Error details:', data.details);
          if (data.needsMigration) {
            setError('This chat needs to be migrated to the new format. Please contact support.');
          } else {
            setError(`${data.error || 'Failed to load messages'}${data.details ? `: ${data.details}` : ''}`);
          }
          setLoading(false);
          return;
        }
        
        result = data;
      } else {
        // For regular chats, use the action
        result = await getChatHistory(chatRoom._id, userId, page, 20);
      }
      
      if (result.success && result.data) {
        const newMessages = result.data;
        console.log('Loaded messages:', newMessages.map(m => ({ 
          _id: m._id, 
          content: m.content?.substring(0, 20),
          replyTo: m.replyTo,
          messageType: m.messageType,
          sender: m.sender 
        })));
        
        if (isLoadingMore) {
          // Prepend older messages to the beginning, but filter out duplicates
          setMessages(prev => {
            const existingIds = new Set(prev.map(msg => msg._id));
            const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg._id));
            return [...uniqueNewMessages, ...prev];
          });
        } else {
          // Set initial messages for new chat room
          setMessages(newMessages);
          // Mark chat room as read when loading initial history
          await markChatRoomAsRead(chatRoom._id, userId);
          // Update the UI immediately
          if (onMarkAsRead) {
            onMarkAsRead(chatRoom._id);
          }
        }

        // Check if there are more messages to load
        setHasMoreMessages(newMessages.length === 20);
        setCurrentPage(page);
      } else {
        toast.error(result.error || t('errors.failedToLoadMessages'));
      }
    } catch (error) {
      toast.error(t('errors.failedToLoadMessages'));
    } finally {
      if (isLoadingMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || loadingMore || !chatRoom) return;
    
    const nextPage = currentPage + 1;
    await loadChatHistory(nextPage, true);
  };

  const joinChatRoom = () => {
    if (chatRoom && emit) {
      emit('chat:join', { chatRoomId: chatRoom._id });
    }
  };

  const checkUserOnlineStatus = () => {
    if (otherUser && emit) {
      emit('user:check-online', { userId: otherUser._id });
    }
  };

  const handleNewMessage = (message: ChatMessage) => {
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      if (prev.some(msg => msg._id === message._id)) {
        return prev;
      }
      return [...prev, message];
    });
    
    // Play notification sound for incoming messages (not from current user)
    if (message.sender._id !== userId) {
      try {
        const notificationSound = new Audio('/sounds/notification.mp3');
        notificationSound.play();

        const oldTitle = document.title
        document.title = "New message"

        setInterval(()=>{
            document.title = oldTitle
        },5000)

      } catch (e) {
      }
    }
    
    // Mark message as read if chat is open and message is from other user
    if (chatRoom && message.chatRoom === chatRoom._id && message.sender._id !== userId) {
      markMessageAsRead(message._id);
      // Update the UI immediately
      if (onMarkAsRead) {
        onMarkAsRead(chatRoom._id);
      }
    }
  };

  const handleMessageSent = (message: ChatMessage) => {
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      if (prev.some(msg => msg._id === message._id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  const handleMessageRead = (data: { messageId: string; readAt: Date }) => {
    setMessages(prev => 
      prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, isRead: true, readAt: data.readAt }
          : msg
      )
    );
  };

  const handleTyping = (data: { userId: string; isTyping: boolean }) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (data.isTyping) {
        newSet.add(data.userId);
      } else {
        newSet.delete(data.userId);
      }
      return newSet;
    });

    // Clear typing indicator after 8 seconds
    if (data.isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }, 8000);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      // Validate message ID format
      if (!messageId || typeof messageId !== 'string') {
        console.error('Invalid message ID:', messageId);
        return;
      }
      
      console.log('Marking message as read:', { messageId, userRole, length: messageId.length });
      
      // Use Next.js API route instead of direct backend call
      const readEndpoint = userRole === 'support'
        ? `/api/support/chat/message/${messageId}/read`
        : `/api/chat/message/${messageId}/read`;
        
      const response = await fetch(readEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        try {
          const text = await response.text();
          console.error('Failed to mark message as read - Response:', text);
          try {
            const data = JSON.parse(text);
            console.error('Parsed error:', data);
            if (data.details) {
              console.error('Error details:', data.details);
            }
            if (data.messageId) {
              console.error('Message ID that failed:', data.messageId);
            }
          } catch (parseError) {
            console.error('Failed to parse error response');
          }
        } catch (e) {
          console.error('Failed to read error response:', e);
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Modern chat feature handlers
  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const editEndpoint = userRole === 'support'
        ? `/api/support/chat/message/${messageId}/edit`
        : `/api/chat/message/${messageId}/edit`;
        
      const response = await fetch(editEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        // Update the message in the local state
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, content: newContent, isEdited: true, editedAt: new Date().toISOString() }
            : msg
        ));
        toast.success('Message edited successfully');
      } else {
        toast.error('Failed to edit message');
      }
    } catch (error) {
      toast.error('Failed to edit message');
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      const pinEndpoint = userRole === 'support'
        ? `/api/support/chat/message/${messageId}/pin`
        : `/api/chat/message/${messageId}/pin`;
        
      const response = await fetch(pinEndpoint, {
        method: 'POST',
      });

      if (response.ok) {
        // Update the message in the local state
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, isPinned: !msg.isPinned }
            : msg
        ));
        toast.success('Message pinned/unpinned successfully');
      } else {
        toast.error('Failed to pin message');
      }
    } catch (error) {
      toast.error('Failed to pin message');
    }
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const reactEndpoint = userRole === 'support'
        ? `/api/support/chat/message/${messageId}/react`
        : `/api/chat/message/${messageId}/react`;
        
      const response = await fetch(reactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the message with new reactions
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, reactions: data.reactions }
            : msg
        ));
      } else {
        toast.error('Failed to add reaction');
      }
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const deleteEndpoint = userRole === 'support'
        ? `/api/support/chat/message/${messageId}`
        : `/api/chat/message/${messageId}`;
        
      const response = await fetch(deleteEndpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the message from local state
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        toast.success('Message deleted successfully');
      } else {
        toast.error('Failed to delete message');
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const sendMessage = async (content: string, messageType: MessageType = MessageType.TEXT, files?: File[], replyToId?: string) => {
    if (!chatRoom) return;

    try {
      if (files && files.length > 0) {
        // Handle file upload
        const formData = new FormData();
        formData.append('messageType', messageType);
        files.forEach(file => formData.append('files', file));

        const fileEndpoint = userRole === 'support'
          ? `/api/support/chat/${chatRoom._id}/message-with-file`
          : `/api/chat/${chatRoom._id}/message-with-file`;
          
        const response = await fetch(fileEndpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to send message with files');
        }
        
        // Get the sent message from response and add it to the UI
        const data = await response.json();
        if (data.success && data.data) {
          handleNewMessage(data.data);
        }
      } else {
        // Handle text message
        console.log('Sending message:', { messageType, content, replyTo: replyToId, userRole });
        
        // Use different endpoint for support chat
        const endpoint = userRole === 'support' 
          ? `/api/support/chat/${chatRoom._id}/message`
          : `/api/chat/${chatRoom._id}/message`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageType,
            content,
            replyTo: replyToId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Send message error:', errorData);
          throw new Error('Failed to send message');
        }
        
        // Get the sent message from response and add it to the UI
        const data = await response.json();
        console.log('Message sent successfully:', data);
        if (data.success && data.data) {
          console.log('New message data:', {
            _id: data.data._id,
            content: data.data.content?.substring(0, 20),
            replyTo: data.data.replyTo,
            replyToId: replyToId,
            sender: data.data.sender,
            fullData: data.data
          });
          handleNewMessage(data.data);
          // Clear reply after successful send
          if (replyToId) {
            setReplyingTo(null);
          }
        }
      }
    } catch (error) {
      toast.error(t('errors.failedToSendMessage'));
    }
  };

  const handleTypingStart = () => {
    if (emit && chatRoom) {
      emit('chat:typing', { chatRoomId: chatRoom._id, isTyping: true });
    }
  };

  const handleTypingStop = () => {
    if (emit && chatRoom) {
      emit('chat:typing', { chatRoomId: chatRoom._id, isTyping: false });
    }
  };


  if (!chatRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-muted/10">
        <div className="max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Menu className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('empty.selectConversation')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('startConversationWith', { userType: userRole === 'seller' ? t('providers') : userRole === 'provider' ? t('sellers') : 'users' })}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('chats')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {otherUser?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate">
              {otherUser?.businessName || otherUser?.name}
            </h3>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                otherUserOnline 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`} />
              <p className="text-xs text-muted-foreground">
                {otherUserOnline ? t('status.online') : t('status.offline')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Block User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ModernMessagesList
          ref={messagesListRef}
          messages={messages}
          currentUserId={userId}
          loading={loading}
          loadingMore={loadingMore}
          hasMoreMessages={hasMoreMessages}
          typingUsers={typingUsers}
          otherUser={otherUser as ChatUser}
          chatRoomId={chatRoom?._id}
          onLoadMore={loadMoreMessages}
          onReplyToMessage={handleReplyToMessage}
          onEditMessage={handleEditMessage}
          onPinMessage={handlePinMessage}
          onReactToMessage={handleReactToMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <ModernMessageInput
          onSendMessage={sendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          disabled={false}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </div>
    </div>
  );
}
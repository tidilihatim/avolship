'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ChatMessage, ChatUser } from '@/types/chat';
import { MessageItem } from './message-item';
import { TypingIndicator } from './typing-indicator';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MessagesListProps {
  messages: ChatMessage[];
  currentUserId: string;
  loading: boolean;
  loadingMore: boolean;
  hasMoreMessages: boolean;
  typingUsers: Set<string>;
  otherUser?: ChatUser;
  chatRoomId?: string;
  onLoadMore: () => void;
}

export interface MessagesListRef {
  scrollToBottom: () => void;
}

export const MessagesList = forwardRef<MessagesListRef, MessagesListProps>(({
  messages,
  currentUserId,
  loading,
  loadingMore,
  hasMoreMessages,
  typingUsers,
  otherUser,
  chatRoomId,
  onLoadMore
}, ref) => {
  const t = useTranslations('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);
  
  const scrollToBottom = () => {
    console.log('scrollToBottom called', { messagesEndRef: messagesEndRef.current });
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
      console.log('scrollIntoView executed');
    }
    
    // Fallback: also try scrolling the container
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      console.log('scrollTop fallback executed');
    }
  };

  // Expose scrollToBottom function to parent component
  useImperativeHandle(ref, () => ({
    scrollToBottom
  }), []);

  // NO AUTOMATIC SCROLLING - parent component controls when to scroll

  // Handle scroll detection for pagination
  useEffect(() => {
    const scrollElement = scrollAreaRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop } = scrollElement;
      
      // Load more messages when scrolled near the top (within 100px)
      if (scrollTop < 100 && hasMoreMessages && !loadingMore && !loading) {
        // Store current scroll height before loading more
        prevScrollHeight.current = scrollElement.scrollHeight;
        onLoadMore();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, loadingMore, loading, onLoadMore]);

  // Maintain scroll position after loading more messages
  useEffect(() => {
    const scrollElement = scrollAreaRef.current;
    if (!scrollElement) return;

    // Only adjust scroll position when we just finished loading more messages
    if (prevScrollHeight.current > 0 && !loadingMore) {
      const newScrollHeight = scrollElement.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeight.current;
      
      if (heightDifference > 0) {
        scrollElement.scrollTop = heightDifference;
      }
      
      // Reset the previous scroll height
      prevScrollHeight.current = 0;
    }
  }, [loadingMore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4" ref={scrollAreaRef}>
      <div className="py-4 space-y-4">
        {/* Loading spinner at top when loading more messages */}
        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">{t('loading.loadingMessages')}</span>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('empty.startConversation')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('empty.noMessages')}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isCurrentUser = message.sender._id === currentUserId;
              const showAvatar = !isCurrentUser && (
                index === 0 || 
                messages[index - 1].sender._id !== message.sender._id
              );
              const showTimestamp = (
                index === messages.length - 1 ||
                messages[index + 1].sender._id !== message.sender._id ||
                (new Date(messages[index + 1].createdAt).getTime() - new Date(message.createdAt).getTime()) > 300000 // 5 minutes
              );

              return (
                <MessageItem
                  key={message._id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                />
              );
            })}
            
            {typingUsers.size > 0 && otherUser && typingUsers.has(otherUser._id) && (
              <TypingIndicator user={otherUser} />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

MessagesList.displayName = 'MessagesList';
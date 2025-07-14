'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ChatMessage, ChatUser } from '@/types/chat';
import { ModernMessageItem } from './modern-message-item';
import { TypingIndicator } from './typing-indicator';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ModernMessagesListProps {
  messages: ChatMessage[];
  currentUserId: string;
  loading: boolean;
  loadingMore: boolean;
  hasMoreMessages: boolean;
  typingUsers: Set<string>;
  otherUser?: ChatUser;
  chatRoomId?: string;
  onLoadMore: () => void;
  onReplyToMessage?: (message: ChatMessage) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onPinMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export interface ModernMessagesListRef {
  scrollToBottom: () => void;
}

export const ModernMessagesList = forwardRef<ModernMessagesListRef, ModernMessagesListProps>(({
  messages,
  currentUserId,
  loading,
  loadingMore,
  hasMoreMessages,
  typingUsers,
  otherUser,
  chatRoomId,
  onLoadMore,
  onReplyToMessage,
  onEditMessage,
  onPinMessage,
  onReactToMessage,
  onDeleteMessage
}, ref) => {
  const t = useTranslations('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  // Expose scrollToBottom function to parent component
  useImperativeHandle(ref, () => ({
    scrollToBottom
  }), []);

  // Handle scroll detection for pagination
  useEffect(() => {
    const scrollElement = scrollAreaRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop } = scrollElement;
      
      // Load more messages when scrolled near the top (within 100px)
      if (scrollTop < 100 && hasMoreMessages && !loadingMore && !loading) {
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

    if (prevScrollHeight.current > 0 && !loadingMore) {
      const newScrollHeight = scrollElement.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeight.current;
      
      if (heightDifference > 0) {
        scrollElement.scrollTop = heightDifference;
      }
      
      prevScrollHeight.current = 0;
    }
  }, [loadingMore]);

  // Group messages by date and consecutive sender
  const groupedMessages = () => {
    const groups: Array<{
      date: string;
      messages: Array<{
        message: ChatMessage;
        showAvatar: boolean;
        showTimestamp: boolean;
      }>;
    }> = [];

    let currentDate = '';
    let currentGroup: Array<{
      message: ChatMessage;
      showAvatar: boolean;
      showTimestamp: boolean;
    }> = [];

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt).toDateString();
      const prevMessage = messages[index - 1];
      const nextMessage = messages[index + 1];
      
      // Check if we need a new date group
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [];
      }

      // Determine if we should show avatar and timestamp
      const showAvatar = !prevMessage || 
                        prevMessage.sender._id !== message.sender._id ||
                        new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000; // 5 minutes

      const showTimestamp = !nextMessage ||
                           nextMessage.sender._id !== message.sender._id ||
                           new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000; // 5 minutes

      currentGroup.push({
        message,
        showAvatar,
        showTimestamp
      });
    });

    // Add the last group
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const handleReply = (message: ChatMessage) => {
    if (onReplyToMessage) {
      onReplyToMessage(message);
    }
  };

  const findReplyToMessage = (messageId: string) => {
    return messages.find(msg => msg._id === messageId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm text-muted-foreground">{t('loading')}</span>
        </div>
      </div>
    );
  }

  const groupedData = groupedMessages();

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div 
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-4"
      >
        {/* Load More Button */}
        {hasMoreMessages && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="mb-4"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('loadingMore')}
                </>
              ) : (
                t('loadMore')
              )}
            </Button>
          </div>
        )}

        {/* Pinned Messages */}
        {messages.some(msg => msg.isPinned || false) && (
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              📌 Pinned Messages
            </div>
            <div className="space-y-2 border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-950/20">
              {messages
                .filter(msg => msg.isPinned || false)
                .map((message) => (
                  <div key={`pinned-${message._id}`} className="text-sm p-2 rounded bg-background">
                    <strong>{message.sender.name}:</strong> {message.content}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Grouped Messages */}
        {groupedData.map((group) => (
          <div key={group.date} className="space-y-2">
            {/* Date Separator */}
            <div className="flex items-center justify-center">
              <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                {formatDate(group.date)}
              </div>
            </div>

            {/* Messages in this date group */}
            <div className="space-y-2">
              {group.messages.map(({ message, showAvatar, showTimestamp }) => {
                // Don't pass replyToMessage separately since it's already in message.replyTo
                return (
                  <ModernMessageItem
                    key={message._id}
                    message={message}
                    isCurrentUser={message.sender._id === currentUserId}
                    showAvatar={showAvatar}
                    showTimestamp={showTimestamp}
                    replyToMessage={undefined} // Let the component use message.replyTo directly
                    onReply={handleReply}
                    onEdit={onEditMessage}
                    onPin={onPinMessage}
                    onReact={onReactToMessage}
                    onDelete={onDeleteMessage}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && otherUser && (
          <div className="flex items-start space-x-3">
            <div className="w-8" />
            <TypingIndicator
              users={Array.from(typingUsers)
                .filter(userId => userId !== currentUserId)
                .map(userId => otherUser)
                .filter(Boolean)}
            />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});
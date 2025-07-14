'use client';

import { useState, useEffect, useRef } from 'react';
import { ModernMessagesList, ModernMessagesListRef } from '@/components/chat/modern-messages-list';
import { ModernMessageInput } from '@/components/chat/modern-message-input';
import { ChatMessage, ChatUser } from '@/types/chat';
import { MessageType } from '@/lib/db/models/chat-message';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface TicketChatMessage {
  _id: string;
  senderId: any;
  senderType: string;
  messageType: string;
  content: string;
  attachments: any[];
  isInternal: boolean;
  responseTime?: number;
  isFirstResponse: boolean;
  createdAt: string;
}

interface TicketChatWindowProps {
  ticketId: string;
  messages: TicketChatMessage[];
  currentUserId: string;
  currentUserRole: string;
  onSendMessage: (content: string, isInternal: boolean) => Promise<void>;
  onMessagesUpdate: (messages: TicketChatMessage[]) => void;
  showInternalNote: boolean;
}

export function TicketChatWindow({
  ticketId,
  messages,
  currentUserId,
  currentUserRole,
  onSendMessage,
  onMessagesUpdate,
  showInternalNote
}: TicketChatWindowProps) {
  const t = useTranslations('chat');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesListRef = useRef<ModernMessagesListRef>(null);

  // Convert ticket messages to chat messages format
  const convertedMessages: ChatMessage[] = messages.map(msg => ({
    _id: msg._id,
    chatRoom: ticketId,
    sender: {
      _id: msg.senderId?._id || msg.senderId,
      name: msg.senderId?.name || (msg.senderType === 'customer' ? 'Customer' : 'Support Agent'),
      email: msg.senderId?.email || '',
      role: msg.senderType as any,
      businessName: msg.senderId?.businessName
    },
    receiver: {
      _id: currentUserId,
      name: 'Support',
      email: '',
      role: 'support' as any
    },
    messageType: msg.messageType as MessageType,
    content: msg.content,
    attachments: msg.attachments,
    status: 'sent' as const,
    isRead: true,
    readAt: new Date().toISOString(),
    reactions: [],
    isPinned: false,
    isEdited: false,
    isInternal: msg.isInternal,
    createdAt: msg.createdAt,
    updatedAt: msg.createdAt
  }));

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesListRef.current?.scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (content: string, messageType?: MessageType, files?: File[], replyToId?: string) => {
    try {
      await onSendMessage(content, showInternalNote);
      // Clear reply after successful send
      if (replyToId) {
        setReplyingTo(null);
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages/${messageId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        // Update the message in the parent component
        const updatedMessages = messages.map(msg => 
          msg._id === messageId 
            ? { ...msg, content: newContent }
            : msg
        );
        onMessagesUpdate(updatedMessages);
        toast.success('Message edited successfully');
      } else {
        toast.error('Failed to edit message');
      }
    } catch (error) {
      toast.error('Failed to edit message');
    }
  };

  const handlePinMessage = async (messageId: string) => {
    // Pin functionality can be implemented for support tickets if needed
    toast.info('Pin feature not available for support tickets');
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    // Reaction functionality can be implemented for support tickets if needed
    toast.info('Reactions not available for support tickets');
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the message from the parent component
        const updatedMessages = messages.filter(msg => msg._id !== messageId);
        onMessagesUpdate(updatedMessages);
        toast.success('Message deleted successfully');
      } else {
        toast.error('Failed to delete message');
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleTypingStart = () => {
    // Typing indicators can be implemented with WebSocket for support tickets
  };

  const handleTypingStop = () => {
    // Typing indicators can be implemented with WebSocket for support tickets
  };

  // Create a mock other user for the chat
  const otherUser: ChatUser = {
    _id: 'customer',
    name: messages.find(m => m.senderType === 'customer')?.senderId?.name || 'Customer',
    email: messages.find(m => m.senderType === 'customer')?.senderId?.email || '',
    role: 'seller',
    businessName: ''
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          No messages yet. Start the conversation below.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ModernMessagesList
          ref={messagesListRef}
          messages={convertedMessages}
          currentUserId={currentUserId}
          loading={false}
          loadingMore={false}
          hasMoreMessages={false}
          typingUsers={typingUsers}
          otherUser={otherUser}
          chatRoomId={ticketId}
          onLoadMore={() => {}}
          onReplyToMessage={handleReplyToMessage}
          onEditMessage={currentUserRole === 'support' || currentUserRole === 'admin' ? handleEditMessage : undefined}
          onPinMessage={handlePinMessage}
          onReactToMessage={handleReactToMessage}
          onDeleteMessage={currentUserRole === 'support' || currentUserRole === 'admin' ? handleDeleteMessage : undefined}
        />
      </div>

      {/* Message Input */}
      <div className="border-t">
        {showInternalNote && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-950/20 text-sm text-yellow-600 dark:text-yellow-400">
            🔒 Internal Note - Only visible to support team
          </div>
        )}
        <ModernMessageInput
          onSendMessage={handleSendMessage}
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
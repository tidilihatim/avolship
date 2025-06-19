'use client';

import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChatRoom } from '@/types/chat';
import { cn } from '@/lib/utils';
import { MessageType } from '@/lib/db/models/chat-message';
import { FileText, Image, Paperclip } from 'lucide-react';

interface ChatRoomItemProps {
  chatRoom: ChatRoom;
  userRole: 'seller' | 'provider';
  isSelected: boolean;
  onClick: () => void;
}

export function ChatRoomItem({ chatRoom, userRole, isSelected, onClick }: ChatRoomItemProps) {
  const otherUser = userRole === 'seller' ? chatRoom.provider : chatRoom.seller;
  const initials = otherUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const getLastMessagePreview = () => {
    if (!chatRoom.lastMessage) return 'No messages yet';
    
    switch (chatRoom.lastMessage.messageType) {
      case MessageType.TEXT:
        return chatRoom.lastMessage.content || '';
      case MessageType.IMAGE:
        return '📷 Photo';
      case MessageType.DOCUMENT:
        return '📄 Document';
      case MessageType.PDF:
        return '📋 PDF';
      default:
        return 'Message';
    }
  };

  const getMessageIcon = () => {
    if (!chatRoom.lastMessage) return null;
    
    switch (chatRoom.lastMessage.messageType) {
      case MessageType.IMAGE:
        return <Image className="h-3 w-3" />;
      case MessageType.DOCUMENT:
      case MessageType.PDF:
        return <FileText className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-accent/50",
        isSelected && "bg-accent"
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium truncate">
            {otherUser.businessName || otherUser.name}
          </h3>
          {chatRoom.lastMessage && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(chatRoom.lastMessage.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1 mt-1">
          {getMessageIcon()}
          <p className="text-xs text-muted-foreground truncate">
            {getLastMessagePreview()}
          </p>
        </div>
        
        {otherUser.businessName && otherUser.businessName !== otherUser.name && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {otherUser.name}
          </p>
        )}
      </div>
      
      <div className="flex flex-col items-end space-y-1">
        {!chatRoom.lastMessage?.isRead && chatRoom.lastMessage?.sender._id !== otherUser._id && (
          <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
        )}
        {!chatRoom.isActive && (
          <Badge variant="outline" className="text-xs">
            Inactive
          </Badge>
        )}
      </div>
    </div>
  );
}
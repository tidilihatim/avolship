'use client';

import { format } from 'date-fns';
import { Check, CheckCheck, Download, Eye, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/types/chat';
import { MessageType } from '@/lib/db/models/chat-message';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
}

export function MessageItem({
  message,
  isCurrentUser,
  showAvatar,
  showTimestamp
}: MessageItemProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderAttachment = (attachment: any, index: number) => {
    const isImage = attachment.fileType.startsWith('image/');
    
    if (isImage) {
      return (
        <div key={index} className="relative group">
          <img
            src={attachment.s3Url}
            alt={attachment.originalName}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(attachment.s3Url, '_blank')}
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0"
              onClick={() => window.open(attachment.s3Url, '_blank')}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={index}
        className="flex items-center space-x-3 p-3 rounded-lg border bg-card transition-colors cursor-pointer"
        onClick={() => window.open(attachment.s3Url, '_blank')}
      >
        <div className="flex-shrink-0">
          {attachment.fileType === 'application/pdf' ? (
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-destructive" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{attachment.originalName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
        </div>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex space-x-3",
      isCurrentUser && "flex-row-reverse space-x-reverse"
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar && !isCurrentUser ? (
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {message.sender.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col space-y-1 max-w-xs md:max-w-md",
        isCurrentUser && "items-end"
      )}>
        {/* Message Bubble */}
        <div
          className={cn(
            "rounded-lg px-3 py-2",
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted",
            message.messageType !== MessageType.TEXT && "p-2"
          )}
        >
          {message.messageType === MessageType.TEXT && message.content ? (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            <div className="space-y-2">
              {message.attachments?.map((attachment, index) => 
                renderAttachment(attachment, index)
              )}
            </div>
          )}
        </div>

        {/* Timestamp and Read Status */}
        {showTimestamp && (
          <div className={cn(
            "flex items-center space-x-1 text-xs text-muted-foreground",
            isCurrentUser && "flex-row-reverse space-x-reverse"
          )}>
            <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
            {isCurrentUser && (
              <div className="flex items-center">
                {message.isRead ? (
                  <CheckCheck className="h-3 w-3 text-blue-500" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Check, CheckCheck, Download, Eye, FileText, Reply, MoreVertical,
  Pin, Edit2, Trash2, Copy, Heart, ThumbsUp, Smile, PinIcon
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { ChatMessage } from '@/types/chat';
import { MessageType } from '@/lib/db/models/chat-message';
import { SupportMessageType } from '@/lib/db/models/support-chat-message';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface ModernMessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  replyToMessage?: ChatMessage | null;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onPin?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
}

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

export function ModernMessageItem({
  message,
  isCurrentUser,
  showAvatar,
  showTimestamp,
  replyToMessage,
  onReply,
  onEdit,
  onPin,
  onReact,
  onDelete
}: ModernMessageItemProps) {
  const { data: session } = useSession();
  
  // Debug reply data
  if (message.replyTo || replyToMessage) {
    console.log('Reply data for message:', {
      messageId: message._id,
      hasReplyTo: !!message.replyTo,
      replyToType: typeof message.replyTo,
      replyToContent: message.replyTo,
      hasReplyToMessage: !!replyToMessage,
      replyToMessageContent: replyToMessage,
      willShowReply: !!message.replyTo
    });
  }
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [showReactions, setShowReactions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Check if user can edit (support/admin only, or message sender)
  const isSupport = session?.user?.role === 'support';
  const isAdmin = session?.user?.role === 'admin';
  const canEdit = isSupport || isAdmin || isCurrentUser;
  
  // Check if message is text type (handle both regular and support message types)
  const isTextMessage = message.messageType === MessageType.TEXT || 
                       message.messageType === SupportMessageType.TEXT ||
                       message.messageType === 'text';
  
  // Debug logging
  console.log('Edit permissions:', {
    messageId: message._id,
    userRole: session?.user?.role,
    isSupport,
    isAdmin,
    isCurrentUser,
    canEdit,
    messageType: message.messageType,
    isTextMessage,
    willShowEdit: canEdit && isTextMessage
  });
  
  const canPin = session?.user?.role === 'support' || session?.user?.role === 'admin';

  useEffect(() => {
    if (isEditing && messageRef.current) {
      const input = messageRef.current.querySelector('input');
      input?.focus();
    }
  }, [isEditing]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleEdit = () => {
    if (!canEdit) return;
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message._id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content || '');
    setIsEditing(false);
  };

  const handleReact = (emoji: string) => {
    if (onReact) {
      onReact(message._id, emoji);
    }
    setShowReactions(false);
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
  };

  // Calculate dynamic width based on content length
  const getMessageWidth = () => {
    if (!message.content) return 'fit-content';
    
    const length = message.content.length;
    if (length <= 10) return 'fit-content';
    if (length <= 30) return 'w-fit max-w-[200px]';
    if (length <= 60) return 'w-fit max-w-[300px]';
    return 'w-fit max-w-[400px] md:max-w-[500px]';
  };

  const renderAttachment = (attachment: any, index: number) => {
    const isImage = attachment.fileType.startsWith('image/');
    
    if (isImage) {
      return (
        <div key={index} className="relative group">
          <img
            src={attachment.cloudinaryUrl}
            alt={attachment.originalName}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(attachment.cloudinaryUrl, '_blank')}
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0"
              onClick={() => window.open(attachment.cloudinaryUrl, '_blank')}
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
        className="flex items-center space-x-3 p-3 rounded-lg border bg-card transition-colors cursor-pointer min-w-[200px]"
        onClick={() => window.open(attachment.cloudinaryUrl, '_blank')}
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

  const renderReactions = () => {
    const reactions = message.reactions || [];
    if (reactions.length === 0) return null;

    // Group reactions by emoji
    const reactionGroups = reactions.reduce((acc: any, reaction: any) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {});

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(reactionGroups).map(([emoji, reactions]: [string, any]) => (
          <Button
            key={emoji}
            variant="outline"
            size="sm"
            className="h-6 px-2 py-0 text-xs"
            onClick={() => handleReact(emoji)}
          >
            <span className="mr-1">{emoji}</span>
            <span>{reactions.length}</span>
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div 
      ref={messageRef}
      className={cn(
        "flex space-x-3 group relative",
        isCurrentUser && "flex-row-reverse space-x-reverse"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ isolation: 'isolate' }}
    >
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
        "flex flex-col space-y-1",
        isCurrentUser && "items-end"
      )}>
        {/* Reply Reference */}
        {message.replyTo && (
          <div className={cn(
            "text-xs p-2 rounded border-l-2 bg-muted/50 max-w-[300px] mb-1",
            isCurrentUser ? "border-l-primary" : "border-l-muted-foreground"
          )}>
            {typeof message.replyTo === 'object' ? (
              <>
                <p className="font-medium text-muted-foreground">
                  Replying to {message.replyTo.sender?.name || 'Unknown'}
                </p>
                <p className="truncate">{message.replyTo.content || '[No content]'}</p>
              </>
            ) : (
              <p className="text-muted-foreground italic">Loading reply...</p>
            )}
          </div>
        )}

        {/* Pin Indicator */}
        {(message.isPinned || false) && (
          <div className={cn(
            "flex items-center text-xs text-muted-foreground",
            isCurrentUser && "flex-row-reverse"
          )}>
            <PinIcon className="h-3 w-3 mr-1" />
            <span>Pinned message</span>
          </div>
        )}

        {/* Message Container with Actions */}
        <div className="relative group">
          {/* Message Actions - Show on hover */}
          {isHovered && !isEditing && (
            <div className={cn(
              "absolute -top-7 flex items-center space-x-1 transition-all duration-200 z-50 bg-background/90 backdrop-blur-sm rounded-md p-1 shadow-lg",
              isCurrentUser ? "right-0" : "left-0"
            )}>
              {/* Reaction Popover */}
              <Popover open={showReactions} onOpenChange={setShowReactions}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-2 z-[300]">
                  <div className="flex gap-1">
                    {commonEmojis.map(emoji => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleReact(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Reply Button */}
              {onReply && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0"
                  onClick={() => onReply(message)}
                >
                  <Reply className="h-4 w-4" />
                </Button>
              )}

              {/* More Actions */}
              <DropdownMenu open={undefined} modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 p-0 relative z-10"
                    type="button"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align={isCurrentUser ? "end" : "start"} 
                  side="bottom"
                  sideOffset={5}
                  className="z-[300] min-w-[160px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  
                  {canEdit && isTextMessage && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  
                  {canPin && onPin && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onPin(message._id);
                      }}
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {(message.isPinned || false) ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                  )}
                  
                  {(isCurrentUser || canEdit) && onDelete && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(message._id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={cn(
              "rounded-lg px-3 py-2",
              getMessageWidth(),
              isCurrentUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
              !isTextMessage && "p-2",
              (message.isPinned || false) && "ring-2 ring-yellow-400"
            )}
          >
            {isEditing ? (
              <div className="space-y-2 min-w-[200px]">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                {isTextMessage && message.content ? (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                    {(message.isEdited || false) && (
                      <span className="text-xs opacity-70 ml-2">(edited)</span>
                    )}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {message.attachments?.map((attachment, index) => 
                      renderAttachment(attachment, index)
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reactions */}
        {renderReactions()}

        {/* Timestamp and Read Status */}
        {showTimestamp && (
          <div className={cn(
            "flex items-center space-x-1 text-xs text-muted-foreground",
            isCurrentUser && "flex-row-reverse space-x-reverse"
          )}>
            <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
            {isCurrentUser && (
              <div className="flex items-center">
                {message.status === 'read' || message.isRead ? (
                  <CheckCheck className="h-3 w-3 text-blue-500" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Check className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
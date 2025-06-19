'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatUser } from '@/types/chat';

interface TypingIndicatorProps {
  user: ChatUser;
}

export function TypingIndicator({ user }: TypingIndicatorProps) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="flex space-x-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col space-y-1">
        <div className="bg-muted rounded-lg px-3 py-2 max-w-fit">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        <span className="text-xs text-muted-foreground ml-3">
          {user.businessName || user.name} is typing...
        </span>
      </div>
    </div>
  );
}
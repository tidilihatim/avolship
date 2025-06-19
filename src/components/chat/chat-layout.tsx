'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './chat-sidebar';
import { ChatWindow } from './chat-window';
import { ChatRoom } from '@/types/chat';

interface ChatLayoutProps {
  userRole: 'seller' | 'provider';
  userId: string;
  chatRooms: ChatRoom[];
  onRefresh?: () => void;
  onMarkAsRead?: (chatRoomId: string) => void;
}

export function ChatLayout({ userRole, userId, chatRooms, onRefresh, onMarkAsRead }: ChatLayoutProps) {
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out border-r h-full",
        isSidebarOpen ? "w-80" : "w-0 overflow-hidden"
      )}>
        <ChatSidebar
          userRole={userRole}
          userId={userId}
          chatRooms={chatRooms}
          selectedChatRoom={selectedChatRoom}
          onChatRoomSelect={setSelectedChatRoom}
          onRefresh={onRefresh}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        <ChatWindow
          chatRoom={selectedChatRoom}
          userId={userId}
          userRole={userRole}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onMarkAsRead={onMarkAsRead}
        />
      </div>
    </div>
  );
}
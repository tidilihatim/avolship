'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './chat-sidebar';
import { ChatWindow } from './chat-window';
import { ChatRoom } from '@/types/chat';

interface ChatLayoutProps {
  userRole: 'seller' | 'provider' | 'support';
  userId: string;
  chatRooms: ChatRoom[];
  onRefresh?: () => void;
  onMarkAsRead?: (chatRoomId: string) => void;
  initialSelectedChatRoom?: ChatRoom | null;
}

export function ChatLayout({ userRole, userId, chatRooms, onRefresh, onMarkAsRead, initialSelectedChatRoom }: ChatLayoutProps) {
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(initialSelectedChatRoom || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Update selected chat room when initialSelectedChatRoom changes
  useEffect(() => {
    if (initialSelectedChatRoom) {
      setSelectedChatRoom(initialSelectedChatRoom);
    }
  }, [initialSelectedChatRoom]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out border-r flex-shrink-0",
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
      <div className="flex-1 min-w-0">
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
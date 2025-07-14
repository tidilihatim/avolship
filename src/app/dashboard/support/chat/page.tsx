'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ChatLayout } from '@/components/chat/chat-layout';
import { ChatClient } from '@/components/chat/chat-client';

export default function SupportChatPage() {
  const { data: session } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setIsReady(true);
    }
  }, [session]);

  if (!isReady || !session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatClient 
        userId={session.user.id} 
        userRole="support" // Support agents can see all conversations
      />
    </div>
  );
}
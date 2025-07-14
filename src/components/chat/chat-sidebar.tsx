'use client';

import { useState } from 'react';
import { Search, MessageCircle, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatRoom } from '@/types/chat';
import { ChatRoomItem } from './chat-room-item';
import { ProvidersList } from './providers-list';
import { useTranslations } from 'next-intl';

interface ChatSidebarProps {
  userRole: 'seller' | 'provider' | 'support';
  userId: string;
  chatRooms: ChatRoom[];
  selectedChatRoom: ChatRoom | null;
  onChatRoomSelect: (chatRoom: ChatRoom) => void;
  onRefresh?: () => void;
}

export function ChatSidebar({
  userRole,
  userId,
  chatRooms,
  selectedChatRoom,
  onChatRoomSelect,
  onRefresh
}: ChatSidebarProps) {
  const t = useTranslations('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats');

  const getUnreadCount = () => {
    if (!chatRooms || !Array.isArray(chatRooms)) return 0;
    return chatRooms.filter(room => {
      // Check if there's a last message that's unread and not from the current user
      if (!room.lastMessage) return false;
      const isFromOtherUser = room.lastMessage.sender._id !== userId;
      return !room.lastMessage.isRead && isFromOtherUser;
    }).length;
  };

  const filteredChatRooms = !chatRooms || !Array.isArray(chatRooms) ? [] : chatRooms.filter(room => {
    const otherUser = userRole === 'seller' ? room.provider : 
                     userRole === 'provider' ? room.seller :
                     // For support, show the non-support user (could be either seller or provider)
                     room.seller || room.provider;
    const searchTerm = searchQuery.toLowerCase();
    return (
      otherUser.name.toLowerCase().includes(searchTerm) ||
      otherUser.email.toLowerCase().includes(searchTerm) ||
      (otherUser.businessName && otherUser.businessName.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchConversations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mt-2 h-10">
          <TabsTrigger value="chats" className="flex items-center justify-center gap-1 text-xs px-2 min-w-0">
            <MessageCircle className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{t('chats')}</span>
            {getUnreadCount() > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs h-4 min-w-4 px-1">
                {getUnreadCount()}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center justify-center gap-1 text-xs px-2 min-w-0">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {userRole === 'seller' ? t('providers') : 
               userRole === 'provider' ? t('sellers') :
               'Users'}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-1 mt-2 px-0">
          <ScrollArea className="flex-1 px-4">
            {filteredChatRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  {searchQuery ? t('noConversationsFound') : t('noConversationsYet')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? t('tryDifferentSearch') : t('startConversationWith', { userType: userRole === 'seller' ? t('providers') : userRole === 'provider' ? t('sellers') : 'users' })}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChatRooms.map((room) => (
                  <ChatRoomItem
                    key={room._id}
                    chatRoom={room}
                    userRole={userRole}
                    isSelected={selectedChatRoom?._id === room._id}
                    onClick={() => onChatRoomSelect(room)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="providers" className="flex-1 mt-2 px-0">
          <ProvidersList
            userRole={userRole}
            userId={userId}
            onChatStart={onChatRoomSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
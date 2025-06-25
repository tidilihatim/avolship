'use client';

import { useState, useEffect } from 'react';
import { Search, MessageCircle, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChatRoom, ChatUser } from '@/types/chat';
import { toast } from 'sonner';
import { getUsers } from '@/app/actions/chat';
import { UserRole } from '@/lib/db/models/user';
import { useTranslations } from 'next-intl';
import { getAccessToken } from '@/app/actions/cookie';

interface ProvidersListProps {
  userRole: 'seller' | 'provider';
  userId: string;
  onChatStart: (chatRoom: ChatRoom) => void;
}

export function ProvidersList({ userRole, userId, onChatStart }: ProvidersListProps) {
  const t = useTranslations('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [userRole]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const targetRole = userRole === 'seller' ? UserRole.PROVIDER : UserRole.SELLER;
      const result = await getUsers(targetRole, 'approved');
      
      if (result.success && result.data) {
        setProviders(result.data.map(user => ({
          ...user,
          role: user.role as 'seller' | 'provider'
        })));
      } else {
        toast.error(result.error || t('loading.loadingUsers'));
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      toast.error(t('loading.loadingUsers'));
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (providerId: string) => {
    if (creatingChat === providerId) return;
    
    setCreatingChat(providerId);

     const jwtToken = await getAccessToken();
        if (!jwtToken) {
          return toast.error("Configuration Error")
        }
    try {
      const sellerId = userRole === 'seller' ? userId : providerId;
      const actualProviderId = userRole === 'seller' ? providerId : userId;

      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/chat/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "authorization": `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          sellerId,
          providerId: actualProviderId,
        }),
      });

      if (response.ok) {
        const { data: chatRoom } = await response.json();
        onChatStart(chatRoom);
        toast.success(t('actions.chatStarted'));
      } else {
        throw new Error('Failed to create chat room');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error(t('actions.failedToStartChat'));
    } finally {
      setCreatingChat(null);
    }
  };

  const filteredProviders = providers.filter(provider => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      provider.name.toLowerCase().includes(searchTerm) ||
      provider.email.toLowerCase().includes(searchTerm) ||
      (provider.businessName && provider.businessName.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={userRole === 'seller' ? t('searchUsers') : t('searchSellers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Providers List */}
      <ScrollArea className="flex-1 px-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {searchQuery ? t('noMatches') : t('noUsersAvailable', { userType: userRole === 'seller' ? t('providers') : t('sellers') })}
            </p>
            <p className="text-xs text-muted-foreground">
              {searchQuery && t('tryDifferentSearch')}
            </p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {filteredProviders.map((provider) => (
              <ProviderItem
                key={provider._id}
                provider={provider}
                onStartChat={() => startChat(provider._id)}
                isCreatingChat={creatingChat === provider._id}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ProviderItemProps {
  provider: ChatUser;
  onStartChat: () => void;
  isCreatingChat: boolean;
}

function ProviderItem({ provider, onStartChat, isCreatingChat }: ProviderItemProps) {
  const initials = provider.name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium truncate">
          {provider.businessName || provider.name}
        </h3>
        {provider.businessName && provider.businessName !== provider.name && (
          <p className="text-xs text-muted-foreground truncate">
            {provider.name}
          </p>
        )}
        <p className="text-xs text-muted-foreground truncate">
          {provider.email}
        </p>
        <Badge variant="outline" className="text-xs mt-1">
          {provider.role}
        </Badge>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onStartChat}
        disabled={isCreatingChat}
        className="h-8 w-8 p-0"
      >
        {isCreatingChat ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
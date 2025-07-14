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

interface ProvidersListProps {
  userRole: 'seller' | 'provider' | 'support';
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
      if (userRole === 'support') {
        // For support, fetch both sellers and providers
        const [sellersResult, providersResult] = await Promise.all([
          getUsers(UserRole.SELLER, 'approved'),
          getUsers(UserRole.PROVIDER, 'approved')
        ]);
        
        console.log('getUsers results:', { sellersResult, providersResult });
        
        const allUsers: ChatUser[] = [];
        
        if (sellersResult && sellersResult.success && sellersResult.data) {
          allUsers.push(...sellersResult.data.map(user => ({
            ...user,
            role: 'seller' as const
          })));
        }
        
        if (providersResult && providersResult.success && providersResult.data) {
          allUsers.push(...providersResult.data.map(user => ({
            ...user,
            role: 'provider' as const
          })));
        }
        
        setProviders(allUsers);
      } else {
        // For sellers/providers, fetch the opposite role
        const targetRole = userRole === 'seller' ? UserRole.PROVIDER : UserRole.SELLER;
        const result = await getUsers(targetRole, 'approved');
        
        console.log('getUsers result:', result);
        
        if (result && result.success && result.data) {
          setProviders(result.data.map(user => ({
            ...user,
            role: user.role as 'seller' | 'provider'
          })));
        } else {
          console.error('getUsers failed:', result);
          toast.error(result?.error || 'Failed to fetch users');
        }
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (providerId: string) => {
    if (creatingChat === providerId) return;
    
    setCreatingChat(providerId);
    
    try {
      console.log('Starting chat with userRole:', userRole, 'userId:', userId, 'providerId:', providerId);
      
      let endpoint, requestBody;
      
      // Normalize the role to lowercase for comparison
      const normalizedRole = userRole?.toLowerCase();
      
      if (normalizedRole === 'support') {
        // For support, use dedicated support chat endpoint
        endpoint = '/api/support/chat/room';
        requestBody = { customerId: providerId };
        console.log('Support creating chat with user:', providerId);
      } else if (normalizedRole === 'seller' || normalizedRole === 'provider') {
        // For seller/provider, use regular chat endpoint
        endpoint = '/api/chat/room';
        
        let sellerId, actualProviderId;
        if (normalizedRole === 'seller') {
          sellerId = userId;
          actualProviderId = providerId;
        } else {
          sellerId = providerId;
          actualProviderId = userId;
        }
        
        if (!sellerId || !actualProviderId) {
          throw new Error('Unable to determine seller and provider IDs');
        }
        
        requestBody = { sellerId, providerId: actualProviderId };
      } else {
        throw new Error(`Invalid user role: ${userRole} (normalized: ${normalizedRole})`);
      }

      console.log('Creating chat room:', requestBody);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const { data: chatRoom } = await response.json();
        onChatStart(chatRoom);
        toast.success(t('actions.chatStarted'));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create chat room:', errorData);
        throw new Error(errorData.error || 'Failed to create chat room');
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
            placeholder={
              userRole === 'seller' ? t('searchUsers') : 
              userRole === 'provider' ? t('searchSellers') :
              'Search users...'
            }
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
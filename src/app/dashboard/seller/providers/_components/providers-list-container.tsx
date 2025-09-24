'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Eye, MessageCircle, Building2, MapPin, Phone } from 'lucide-react';
import { IUser, UserStatus, UserRole } from '@/lib/db/models/user';
import { getUsers } from '@/app/actions/user';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';

export function ProvidersListContainer() {
  const [providers, setProviders] = useState<IUser[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const t = useTranslations('providers');

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const result = await getUsers(1, 100, { role: UserRole.PROVIDER  });
        
        if (result.success && result.users) {
          setProviders(result.users);
          setFilteredProviders(result.users);
        } else {
          setError(result.message || 'Failed to load providers');
        }
      } catch (err) {
        setError('Failed to load providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = providers.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProviders(filtered);
    } else {
      setFilteredProviders(providers);
    }
  }, [searchTerm, providers]);

  const handleViewProvider = (providerId: string) => {
    router.push(`/dashboard/seller/providers/${providerId}`);
  };

  const handleChatWithProvider = (providerId: string) => {
    router.push(`/dashboard/seller/chat?provider=${providerId}`);
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.APPROVED:
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case UserStatus.PENDING:
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case UserStatus.REJECTED:
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-muted rounded animate-pulse" />
            <div className="h-5 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>

        <div className="h-10 w-full bg-muted rounded animate-pulse" />

        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-9 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('browseAndConnect')}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredProviders.length} {t('providersFound')}
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchProviders')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? t('noProvidersFound') : t('noProvidersAvailable')}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProviders.map((provider: any) => (
            <Card key={provider._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg font-semibold">
                      {provider.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{provider.name}</h3>
                      <Badge className={getStatusColor(provider.status)}>
                        {provider.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {provider.businessName && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{provider.businessName}</span>
                        </div>
                      )}
                      
                      {provider.serviceType && (
                        <div className="flex items-center gap-1">
                          <span className="text-primary">•</span>
                          <span>{provider.serviceType}</span>
                        </div>
                      )}
                      
                      {provider.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{provider.country}</span>
                        </div>
                      )}
                      
          
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProvider(provider._id as string)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('actions.view')}
                    </Button>
                    
                    {provider.status === UserStatus.APPROVED && (
                      <Button
                        size="sm"
                        onClick={() => handleChatWithProvider(provider._id as string)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {t('actions.chat')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
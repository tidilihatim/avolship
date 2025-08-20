'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, MessageCircle, Building2, MapPin, TrendingUp, Zap } from 'lucide-react';
import { IUser, UserStatus, UserRole } from '@/lib/db/models/user';
import { getBoostedProviders, trackProviderClick } from '@/app/actions/tokens';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';
import { ProviderSearch } from '@/components/provider/provider-search';
import { ProviderPagination } from '@/components/provider/provider-pagination';

interface ProvidersData {
  users: IUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
  message: string;
}

const ITEMS_PER_PAGE = 12;

export function ProvidersListServer() {
  const [data, setData] = useState<ProvidersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('providers');

  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchTerm = searchParams.get('search') || '';

  const updateUrl = useCallback((newPage?: number, newSearch?: string) => {
    const params = new URLSearchParams();
    
    if (newPage && newPage > 1) {
      params.set('page', newPage.toString());
    }
    
    if (newSearch) {
      params.set('search', newSearch);
    }
    
    const url = params.toString() 
      ? `/dashboard/seller/providers?${params.toString()}`
      : '/dashboard/seller/providers';
    
    router.push(url);
  }, [router]);

  const fetchProviders = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getBoostedProviders(page, ITEMS_PER_PAGE, { 
        search: search || undefined
      });
      
      setData(result);
      
      if (!result.success) {
        setError(result.message || 'Failed to load providers');
      }
    } catch (err) {
      setError('Failed to load providers');
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders(currentPage, searchTerm);
  }, [fetchProviders, currentPage, searchTerm]);

  const handlePageChange = (page: number) => {
    updateUrl(page, searchTerm);
  };

  const handleSearch = (newSearchTerm: string) => {
    updateUrl(1, newSearchTerm);
  };

  const handleViewProvider = async (providerId: string, isBoosted?: boolean) => {
    // Track click if provider is boosted
    if (isBoosted) {
      try {
        await trackProviderClick(providerId);
      } catch (error) {
        console.error('Failed to track provider click:', error);
      }
    }
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
        {data && (
          <Badge variant="outline" className="text-sm">
            {data.pagination.total} {t('providersFound')}
          </Badge>
        )}
      </div>

      <ProviderSearch 
        onSearch={handleSearch}
        defaultValue={searchTerm}
      />

      {data && data.users.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? t('noProvidersFound') : t('noProvidersAvailable')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6" data-testid="providers-list">
          <div className="grid gap-4">
            {data?.users.map((provider: any) => (
              <Card 
                key={provider._id} 
                className={`hover:shadow-md transition-shadow ${
                  provider.isBoosted ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                }`} 
                data-testid="provider-card"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg font-semibold">
                          {provider.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {provider.isBoosted && (
                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                          <Zap className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{provider.name}</h3>
                        <Badge className={getStatusColor(provider.status)}>
                          {provider.status}
                        </Badge>
                        {provider.isBoosted && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Boosted
                          </Badge>
                        )}
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
                        onClick={() => handleViewProvider(provider._id as string, provider.isBoosted)}
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
            ))}
          </div>

          {data && data.pagination.totalPages > 1 && (
            <ProviderPagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={data.pagination.total}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </div>
      )}
    </div>
  );
}
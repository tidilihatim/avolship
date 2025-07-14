'use client';

import { useEffect, useState } from 'react';
import { ProviderHeader } from '@/components/provider/provider-header';
import { ProviderInfoCard } from '@/components/provider/provider-info-card';
import { ProviderBusinessCard } from '@/components/provider/provider-business-card';
import { ProviderContactCard } from '@/components/provider/provider-contact-card';
import { ProviderStatsCard } from '@/components/provider/provider-stats-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { IUser, UserRole } from '@/lib/db/models/user';
import { getUserById } from '@/app/actions/user';
import { useTranslations } from 'next-intl';
import { ProviderFeaturedAdsSection } from './provider-featured-ads-section';

interface SellerProviderDetailContainerProps {
  providerId: string;
}

export function SellerProviderDetailContainer({ providerId }: SellerProviderDetailContainerProps) {
  const [provider, setProvider] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('providers');

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const result = await getUserById(providerId);
        
        if (result.success && result.user) {
          if (result.user.role !== UserRole.PROVIDER) {
            setError(t('errors.userNotProvider'));
          } else {
            setProvider(result.user);
          }
        } else {
          setError(result.message || t('errors.providerNotFound'));
        }
      } catch (err) {
        setError(t('errors.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [providerId]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 bg-muted rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                  <div className="flex flex-wrap gap-4">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:ml-auto">
                <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-40 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Business Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-full bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                  <div className="h-20 w-full bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Stats Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-40 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-44 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                      <div>
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-20 bg-muted rounded animate-pulse mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || t('errors.unableToLoad')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <ProviderHeader provider={provider} showChatButton={true} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProviderInfoCard provider={provider} hidePrivateInfo={true} />
          <ProviderBusinessCard provider={provider} />
          
          {/* Featured Ads Section */}
          <ProviderFeaturedAdsSection providerId={providerId} />
        </div>
        
        <div className="space-y-6">
          <ProviderStatsCard provider={provider} hidePrivateInfo={true} />
          <ProviderContactCard provider={provider} showActions={true} hidePrivateInfo={true} />
        </div>
      </div>
    </div>
  );
}
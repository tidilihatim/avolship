'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ProviderHeader } from '@/components/provider/provider-header';
import { ProviderInfoCard } from '@/components/provider/provider-info-card';
import { ProviderBusinessCard } from '@/components/provider/provider-business-card';
import { ProviderContactCard } from '@/components/provider/provider-contact-card';
import { ProviderStatsCard } from '@/components/provider/provider-stats-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { IUser } from '@/lib/db/models/user';

export function ProviderDetailContainer() {
  const { data: session } = useSession();
  const [provider, setProvider] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setProvider(session.user as IUser);
      setLoading(false);
    } else {
      setError('Provider information not available');
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !provider) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Unable to load provider information'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <ProviderHeader provider={provider} isOwnProfile={true} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProviderInfoCard provider={provider} />
          <ProviderBusinessCard provider={provider} />
        </div>
        
        <div className="space-y-6">
          <ProviderStatsCard provider={provider} />
          <ProviderContactCard provider={provider} showActions={false} />
        </div>
      </div>
    </div>
  );
}
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Building, MessageCircle } from 'lucide-react';
import { IUser, UserStatus } from '@/lib/db/models/user';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface ProviderHeaderProps {
  provider: IUser;
  showChatButton?: boolean;
  isOwnProfile?: boolean;
}

export function ProviderHeader({ provider, showChatButton = false, isOwnProfile = false }: ProviderHeaderProps) {
  const router = useRouter();
  const t = useTranslations('providers');

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

  const handleChatClick = () => {
    router.push(`/dashboard/seller/chat?provider=${provider._id}`);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl font-semibold">
                {provider.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{provider.name}</h1>
                <Badge className={getStatusColor(provider.status)}>
                  {provider.status}
                </Badge>
              </div>
              
              {provider.businessName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">{provider.businessName}</span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {provider.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{provider.country}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 md:ml-auto">
            {showChatButton && !isOwnProfile && (
              <Button onClick={handleChatClick} className="w-full md:w-auto">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('header.startChat')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
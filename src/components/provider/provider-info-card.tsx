'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Shield } from 'lucide-react';
import { IUser } from '@/lib/db/models/user';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

interface ProviderInfoCardProps {
  provider: IUser;
  hidePrivateInfo?: boolean;
}

export function ProviderInfoCard({ provider, hidePrivateInfo = false }: ProviderInfoCardProps) {
  const t = useTranslations('providers');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t('info.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t('info.fullName')}</label>
            <p className="font-medium">{provider.name}</p>
          </div>
          
          {!hidePrivateInfo && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t('info.emailAddress')}</label>
              <p className="font-medium">{provider.email}</p>
            </div>
          )}
          
          {!hidePrivateInfo && provider.phone && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t('info.phoneNumber')}</label>
              <p className="font-medium">{provider.phone}</p>
            </div>
          )}
          
          {provider.country && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t('info.country')}</label>
              <p className="font-medium">{provider.country}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t('info.role')}</label>
            <Badge variant="outline" className="w-fit">
              {provider.role}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t('info.accountStatus')}</label>
            <Badge 
              variant={provider.status === 'approved' ? 'default' : 'secondary'}
              className="w-fit"
            >
              {provider.status}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t('info.memberSince')}</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">
                {provider?.createdAt ? format(new Date(provider.createdAt), 'MMM dd, yyyy') : "N/A"}
              </p>
            </div>
          </div>
        </div>
        
        {!hidePrivateInfo && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>
                {t('info.twoFactorAuth')}: {provider.twoFactorEnabled ? t('info.enabled') : t('info.disabled')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
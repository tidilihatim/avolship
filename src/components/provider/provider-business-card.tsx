'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileText, Briefcase } from 'lucide-react';
import { IUser } from '@/lib/db/models/user';
import { useTranslations } from 'next-intl';

interface ProviderBusinessCardProps {
  provider: IUser;
}

export function ProviderBusinessCard({ provider }: ProviderBusinessCardProps) {
  const t = useTranslations('providers');
  if (!provider.businessName && !provider.businessInfo && !provider.serviceType) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t('business.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {provider.businessName && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t('business.businessName')}</label>
            <p className="font-medium">{provider.businessName}</p>
          </div>
        )}
        
        {provider.serviceType && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {t('business.serviceType')}
            </label>
            <p className="font-medium">{provider.serviceType}</p>
          </div>
        )}
        
        {provider.businessInfo && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('business.businessDescription')}
            </label>
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {provider.businessInfo}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
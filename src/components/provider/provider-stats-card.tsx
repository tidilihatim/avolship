'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { IUser } from '@/lib/db/models/user';
import { useTranslations } from 'next-intl';

interface ProviderStatsCardProps {
  provider: IUser;
  hidePrivateInfo?: boolean;
}

export function ProviderStatsCard({ provider, hidePrivateInfo = false }: ProviderStatsCardProps) {
  const t = useTranslations('providers');
  const getAccountAge = () => {
    const now = new Date();
    const created = new Date(provider.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} ${t('stats.days')}`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} ${t('stats.months')}`;
    } else {
      return `${Math.floor(diffDays / 365)} ${t('stats.years')}`;
    }
  };

  const getLastActiveStatus = () => {
    if (!provider.lastActive) return t('stats.never');
    
    const now = new Date();
    const lastActive = new Date(provider.lastActive);
    const diffTime = Math.abs(now.getTime() - lastActive.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('stats.today');
    if (diffDays === 1) return t('stats.yesterday');
    if (diffDays < 7) return `${diffDays} ${t('stats.daysAgo')}`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${t('stats.weeksAgo')}`;
    return `${Math.floor(diffDays / 30)} ${t('stats.monthsAgo')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('stats.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">{t('stats.accountAge')}</label>
            </div>
            <p className="font-semibold">{getAccountAge()}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">{t('stats.status')}</label>
            </div>
            <Badge 
              variant={provider.status === 'approved' ? 'default' : 'secondary'}
              className="w-fit"
            >
              {provider.status}
            </Badge>
          </div>
        </div>
        
        {!hidePrivateInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">{t('stats.lastActive')}</label>
            </div>
            <p className="font-medium">{getLastActiveStatus()}</p>
          </div>
        )}
        
        {!hidePrivateInfo && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('stats.securityLevel')}</span>
              <Badge variant={provider.twoFactorEnabled ? 'default' : 'outline'}>
                {provider.twoFactorEnabled ? t('stats.high') : t('stats.standard')}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
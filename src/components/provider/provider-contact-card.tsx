'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, MessageCircle, Copy } from 'lucide-react';
import { IUser } from '@/lib/db/models/user';
import { useTranslations } from 'next-intl';
interface ProviderContactCardProps {
  provider: IUser;
  showActions?: boolean;
  hidePrivateInfo?: boolean;
}

export function ProviderContactCard({ provider, showActions = true, hidePrivateInfo = false }: ProviderContactCardProps) {
  const t = useTranslations('providers');
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} ${t('contact.copiedToClipboard')}`);
  };

  const handleEmailClick = () => {
    window.open(`mailto:${provider.email}`, '_blank');
  };

  const handlePhoneClick = () => {
    if (provider.phone) {
      window.open(`tel:${provider.phone}`, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {t('contact.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {!hidePrivateInfo && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{provider.email}</p>
                  <p className="text-xs text-muted-foreground">{t('contact.emailAddress')}</p>
                </div>
              </div>
              {showActions && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(provider.email, t('contact.emailAddress'))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEmailClick}
                  >
                    <Mail className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {!hidePrivateInfo && provider.phone && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{provider.phone}</p>
                  <p className="text-xs text-muted-foreground">{t('contact.phoneNumber')}</p>
                </div>
              </div>
              {showActions && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(provider.phone!, t('contact.phoneNumber'))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePhoneClick}
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {provider.country && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{provider.country}</p>
                  <p className="text-xs text-muted-foreground">{t('contact.location')}</p>
                </div>
              </div>
              {showActions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(provider.country!, t('contact.location'))}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
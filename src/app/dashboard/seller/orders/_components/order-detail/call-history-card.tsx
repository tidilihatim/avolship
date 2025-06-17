'use client';

import { useTranslations } from 'next-intl';
import { PhoneCall, CheckCircle, Phone, Clock3, XCircle } from 'lucide-react';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CallHistoryCardProps {
  order: any;
  formatDate: (date: Date | string) => string;
}

export default function CallHistoryCard({ order, formatDate }: CallHistoryCardProps) {
  const t = useTranslations('orders');

  const getCallStatusConfig = (status: string) => {
    const configs = {
      answered: { label: t('callStatuses.answered'), className: 'border-primary bg-primary/10', icon: CheckCircle },
      unreached: { label: t('callStatuses.unreached'), className: 'border-muted-foreground bg-muted/10', icon: Phone },
      busy: { label: t('callStatuses.busy'), className: 'border-muted-foreground bg-muted/10', icon: Clock3 },
      invalid: { label: t('callStatuses.invalid'), className: 'border-destructive bg-destructive/10', icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs.unreached;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <PhoneCall className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('callHistory.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('callHistory.totalAttempts')}
          </p>
          <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <PhoneCall className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{order.totalCallAttempts || 0}</p>
          </div>
        </div>
        
        {order.lastCallAttempt && (
          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t('callHistory.lastAttempt')}
                </p>
                <p className="text-sm sm:text-base">
                  {formatDate(order.lastCallAttempt)}
                </p>
              </div>
              
              {order.lastCallStatus && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {t('callHistory.lastStatus')}
                  </p>
                  <Badge variant="outline" className={`${getCallStatusConfig(order.lastCallStatus).className} p-2 text-sm`}>
                    {getCallStatusConfig(order.lastCallStatus).label}
                  </Badge>
                </div>
              )}
            </div>
          </>
        )}
        
        <Separator />
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('callHistory.attemptDetails')}
          </p>
          {order.callAttempts && order.callAttempts.length > 0 ? (
            <ScrollArea className="h-auto">
              <div className="space-y-3">
                {order.callAttempts.map((attempt: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="font-medium text-xs">#{attempt.attemptNumber}</Badge>
                        <span className="font-mono text-xs sm:text-sm truncate">{attempt.phoneNumber}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-xs ${getCallStatusConfig(attempt.status).className}`}>
                        {getCallStatusConfig(attempt.status).label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(attempt.attemptDate), 'MM/dd HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <PhoneCall className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('callHistory.noAttempts')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
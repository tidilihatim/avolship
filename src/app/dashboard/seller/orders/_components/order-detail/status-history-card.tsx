'use client';

import { useTranslations } from 'next-intl';
import { Activity, ArrowRight, Timer, MessageSquare, UserCheck } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderStatus } from '@/lib/db/models/order';

interface StatusHistoryCardProps {
  order: any;
  getStatusConfig: (status: OrderStatus) => any;
  formatDate: (date: Date | string) => string;
  formatDuration: (minutes: number) => string;
}

export default function StatusHistoryCard({ 
  order, 
  getStatusConfig, 
  formatDate, 
  formatDuration 
}: StatusHistoryCardProps) {
  const t = useTranslations('orders');

  if (!order.statusHistory || order.statusHistory.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm" id='history'>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('statusHistory.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('statusHistory.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-auto">
          <div className="space-y-4">
            {order.statusHistory.map((history: any, index: number) => {
              const statusConfig = getStatusConfig(history.currentStatus);
              const StatusIcon = statusConfig.icon;
              const isLast = index === order.statusHistory.length - 1;
              
              return (
                <div key={history._id || index} className="relative">
                  {/* Timeline Line */}
                  {!isLast && (
                    <div className="absolute left-6 sm:left-8 top-12 sm:top-14 w-0.5 h-16 bg-border"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Status Icon */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${statusConfig.className}`}>
                      <StatusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    
                    {/* Status Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-semibold text-sm sm:text-base">{statusConfig.label}</h4>
                            {history.previousStatus && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <span className="hidden sm:inline">{t('statusHistory.changedFrom')}</span>
                                <ArrowRight className="h-3 w-3 mx-1" />
                                <span>{getStatusConfig(history.previousStatus).label}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {formatDate(history.changeDate)}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          {history.timeConsumedInPreviousStatus && (
                            <Badge variant="outline" className="text-xs">
                              <Timer className="h-3 w-3 mr-1" />
                              {formatDuration(history.timeConsumedInPreviousStatus)}
                            </Badge>
                          )}
                          {history.automaticChange && (
                            <Badge variant="secondary" className="text-xs">
                              {t('badges.auto')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Comment */}
                      {history.comment && (
                        <div className="bg-muted/50 p-3 rounded-lg border">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                            <p className="text-sm leading-relaxed">{history.comment}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Changed By */}
                      {history.changedBy && (
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <UserCheck className="h-3 w-3" />
                          <span>{t('fields.changedBy')} {history.changedBy.name}</span>
                          {history.changedByRole && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              {history.changedByRole}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Change Reason for automatic changes */}
                      {history.automaticChange && history.changeReason && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
                          <strong>{t('fields.systemReason')}:</strong> {history.changeReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
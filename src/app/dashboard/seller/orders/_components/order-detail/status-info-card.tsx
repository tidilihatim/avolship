'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, MessageSquare, User } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OrderStatus } from '@/lib/db/models/order';

interface StatusInfoCardProps {
  order: any;
  getStatusConfig: (status: OrderStatus) => any;
  formatDate: (date: Date | string) => string;
}

export default function StatusInfoCard({ 
  order, 
  getStatusConfig, 
  formatDate 
}: StatusInfoCardProps) {
  const t = useTranslations('orders');
  
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('sections.statusInfo')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('fields.currentStatus')}
          </p>
          <div className="space-y-3">
            <Badge variant="outline" className={`${statusConfig.className} p-3 text-sm sm:text-base font-medium w-full justify-start`}>
              <StatusIcon className="mr-3 h-5 w-5" />
              {statusConfig.label}
            </Badge>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {statusConfig.description}
            </p>
          </div>
        </div>
        
        {order.statusComment && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                {t('fields.statusComment')}
              </p>
              <div className="bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                  <p className="text-sm leading-relaxed">{order.statusComment}</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        <Separator />
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {t('fields.statusChangedAt')}
            </p>
            <p className="text-sm sm:text-base">
              {formatDate(order.statusChangedAt)}
            </p>
          </div>
          
          {order.statusChangedBy && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t('fields.changedBy')}
              </p>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium truncate">{order.statusChangedBy.name}</span>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {order.statusChangedBy.role}
                </Badge>
              </div>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {t('fields.orderIdInternal')}
            </p>
            <p className="text-xs sm:text-sm font-mono bg-muted px-3 py-2 rounded-lg border break-all">
              {order._id}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
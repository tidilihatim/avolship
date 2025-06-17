'use client';

import { useTranslations } from 'next-intl';
import { Users, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DoubleOrdersCardProps {
  order: any;
  userRole?: string;
  formatDate: (date: Date | string) => string;
}

export default function DoubleOrdersCard({ order, userRole, formatDate }: DoubleOrdersCardProps) {
  const t = useTranslations('orders');

  if (!order.isDouble || !order.doubleOrderReferences || order.doubleOrderReferences.length === 0) {
    return null;
  }

  return (
    <Card id='double' className="shadow-sm border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Users className="h-5 w-5 text-destructive" />
          </div>
          <CardTitle className="text-lg sm:text-xl text-destructive">{t('doubleOrderDetection.title')}</CardTitle>
        </div>
        <CardDescription className="mt-2">
          {t('doubleOrderDetection.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {order.doubleOrderReferences.map((ref: any, index: number) => (
            <div key={index} className="border rounded-xl p-4 sm:p-6 bg-background">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <h4 className="text-base sm:text-lg font-semibold">{t('doubleOrderDetection.similarOrderFound')}</h4>
                    <code className="bg-muted border px-3 py-2 rounded text-xs sm:text-sm font-mono">
                      {ref.orderNumber}
                    </code>
                  </div>
                  <div className="text-left sm:text-right space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {ref.orderDate ? formatDate(ref.orderDate) : t('time.notAvailable')}
                    </p>
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <Link href={`/dashboard/${userRole}/orders/${ref.orderId}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('actions.viewOrder')}
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                {/* Rule-based Detection Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {t('doubleOrderDetection.detectionRule')}
                      </p>
                      <Badge variant="outline" className="border-destructive bg-destructive/10 text-destructive font-medium">
                        {ref.matchedRule}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">
                        {t('doubleOrderDetection.detectedAt')}
                      </p>
                      <p className="text-xs font-mono">
                        {ref.detectedAt ? formatDate(ref.detectedAt) : t('time.notAvailable')}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive mb-2">
                          {t('doubleOrderDetection.warningTitle')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('doubleOrderDetection.ruleBasedMessage', { rule: ref.matchedRule })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
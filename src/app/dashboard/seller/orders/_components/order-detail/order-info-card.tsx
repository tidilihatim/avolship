'use client';

import { useTranslations } from 'next-intl';
import { Hash, Package, Calendar, Copy } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OrderInfoCardProps {
  order: any;
  formatPrice: (price: number, warehouseId?: string) => string;
  formatDate: (date: Date | string) => string;
  totalQuantity: number;
}

export default function OrderInfoCard({ 
  order, 
  formatPrice, 
  formatDate, 
  totalQuantity 
}: OrderInfoCardProps) {
  const t = useTranslations('orders');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('messages.copiedToClipboard'));
    } catch (error) {
      toast.error(t('messages.failedToCopy'));
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('sections.orderInfo')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t('fields.orderId')}
              </p>
              <div className="flex items-center space-x-3">
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <code className="bg-muted px-3 py-2 rounded-lg font-mono text-sm font-bold flex-1 truncate">
                  {order.orderId}
                </code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => copyToClipboard(order.orderId)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('tooltips.copyOrderId')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t('fields.totalPrice')}
              </p>
              <p className="text-2xl sm:text-3xl font-bold">
                {formatPrice(order.totalPrice, order.warehouseId)}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t('fields.totalItems')}
              </p>
              <p className="text-lg sm:text-xl font-semibold">
                {totalQuantity} {totalQuantity === 1 ? t('products.item') : t('products.items')}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t('fields.orderDate')}
              </p>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm sm:text-base">
                  {formatDate(order.orderDate)}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t('fields.createdAt')}
              </p>
              <p className="text-sm sm:text-base">
                {formatDate(order.createdAt)}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t('fields.lastUpdated')}
              </p>
              <p className="text-sm sm:text-base">
                {formatDate(order.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
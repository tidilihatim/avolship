'use client';

import { useTranslations } from 'next-intl';
import { User, Phone, MapPin, Copy } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CustomerInfoCardProps {
  order: any;
}

export default function CustomerInfoCard({ order }: CustomerInfoCardProps) {
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
            <User className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('sections.customerInfo')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('fields.customerName')}
          </p>
          <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <p className="text-lg sm:text-xl font-semibold truncate">{order.customer?.name}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('fields.phoneNumbers')}
          </p>
          <div className="space-y-3">
            {order.customer?.phoneNumbers?.map((phone: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-mono text-sm sm:text-base truncate">{phone}</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => copyToClipboard(phone)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('tooltips.copyPhoneNumber')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('fields.shippingAddress')}
          </p>
          <div className="p-4 border rounded-lg bg-background">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
              <p className="text-sm sm:text-base leading-relaxed">{order.customer?.shippingAddress}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
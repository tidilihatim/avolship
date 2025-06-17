'use client';

import { useTranslations } from 'next-intl';
import { Building2, Globe, DollarSign } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface WarehouseInfoCardProps {
  order: any;
}

export default function WarehouseInfoCard({ order }: WarehouseInfoCardProps) {
  const t = useTranslations('orders');

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('sections.warehouseInfo')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t('fields.warehouseName')}
          </p>
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm sm:text-base font-medium truncate">{order.warehouseName || t('misc.unknownWarehouse')}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t('fields.warehouseLocation')}
          </p>
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm sm:text-base truncate">{order.warehouseCountry || t('misc.unknown')}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t('fields.warehouseCurrency')}
          </p>
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm sm:text-base font-mono">{order.warehouseCurrency || 'USD'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
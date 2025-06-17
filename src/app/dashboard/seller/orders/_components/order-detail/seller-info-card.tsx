'use client';

import { useTranslations } from 'next-intl';
import { User } from 'lucide-react';
import { UserRole } from '@/lib/db/models/user';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SellerInfoCardProps {
  order: any;
  userRole?: string;
}

export default function SellerInfoCard({ order, userRole }: SellerInfoCardProps) {
  const t = useTranslations('orders');
  
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  if (!isAdminOrModerator) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('sections.sellerInfo')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t('fields.sellerName')}
          </p>
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm sm:text-base font-medium truncate">{order.sellerName || t('misc.unknownSeller')}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t('fields.sellerId')}
          </p>
          <p className="text-xs sm:text-sm font-mono bg-muted px-3 py-2 rounded-lg border break-all">
            {order.sellerId}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
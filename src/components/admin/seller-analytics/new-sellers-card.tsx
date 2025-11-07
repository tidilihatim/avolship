'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users } from 'lucide-react';

interface Seller {
  sellerId: string;
  sellerName: string;
}

interface NewSellersCardProps {
  count: number;
  sellers: Seller[];
}

export function NewSellersCard({ count, sellers }: NewSellersCardProps) {
  const t = useTranslations('adminSellerAnalytics.newSellersCard');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-green-500" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Large Count Display */}
        <div className="flex items-center gap-4 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-4xl font-bold">{count}</div>
            <div className="text-sm text-muted-foreground">
              {t('newSellers', { count })}
            </div>
          </div>
        </div>

        {/* Sellers List */}
        {sellers && sellers.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-3">{t('sellersList')}</div>
            <div className="max-h-[200px] overflow-y-auto">
              <div className="space-y-2">
                {sellers.map((seller) => (
                  <div
                    key={seller.sellerId}
                    className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{seller.sellerName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No New Sellers */}
        {count === 0 && (
          <div className="border-t pt-4 text-center text-sm text-muted-foreground">
            {t('noNewSellers')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

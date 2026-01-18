import React from 'react';
import { getTranslations } from 'next-intl/server';
import { CallCenterSection } from '@/components/dashboard/call-center-section';
import { OrderStatusSection } from '@/components/dashboard/order-status-section';
import { TrendingProductsSection } from '@/components/dashboard/trending-products-section';
import { NetProfitSection } from '@/components/dashboard/net-profit-section';

type Props = {}

export const metadata = {
  title: 'Overview | AvolShip',
}

const page = async (props: Props) => {
  const t = await getTranslations('dashboard.seller.overview');
  
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <NetProfitSection showSellerFilter={false} />
      <CallCenterSection />
      <OrderStatusSection />
      <TrendingProductsSection />

      {/* Future chart sections can be added here with their own filters */}
    </div>
  );
}

export default page
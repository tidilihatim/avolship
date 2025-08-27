import React from 'react';
import { CallCenterSection } from '@/components/dashboard/call-center-section';
import { OrderStatusSection } from '@/components/dashboard/order-status-section';
import { TrendingProductsSection } from '@/components/dashboard/trending-products-section';

type Props = {}

export const metadata = {
  title: 'Overview | AvolShip',
}

const page = async (props: Props) => {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Monitor your business performance with comprehensive analytics
        </p>
      </div>

      <CallCenterSection />
      <OrderStatusSection />
      <TrendingProductsSection />
      
      {/* Future chart sections can be added here with their own filters */}
    </div>
  );
}

export default page
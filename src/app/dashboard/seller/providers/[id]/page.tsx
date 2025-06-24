import { Suspense } from 'react';
import { SellerProviderDetailContainer } from '../_components/seller-provider-detail-container';
import { ProviderDetailSkeleton } from '@/components/provider/provider-detail-skeleton';

interface ProviderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={<ProviderDetailSkeleton />}>
        <SellerProviderDetailContainer providerId={id} />
      </Suspense>
    </div>
  );
}
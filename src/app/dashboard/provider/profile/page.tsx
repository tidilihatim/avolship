import { Suspense } from 'react';
import { ProviderDetailContainer } from './_components/provider-detail-container';
import { ProviderDetailSkeleton } from './_components/provider-detail-skeleton';

export default function ProviderProfilePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={<ProviderDetailSkeleton />}>
        <ProviderDetailContainer />
      </Suspense>
    </div>
  );
}
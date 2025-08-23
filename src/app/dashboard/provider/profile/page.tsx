import { Suspense } from 'react';
import { ProviderDetailContainer } from './_components/provider-detail-container';
import { ProviderDetailSkeleton } from './_components/provider-detail-skeleton';
import { getUserById } from '@/app/actions/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';

export default async function ProviderProfilePage() {

  const session = await getServerSession(authOptions)
  if(!session || !session?.user?.id){
    throw new Error("invalid request")
  }

  const {user:provider} = await getUserById(session?.user?.id);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={<ProviderDetailSkeleton />}>
        <ProviderDetailContainer provider={provider} />
      </Suspense>
    </div>
  );
}
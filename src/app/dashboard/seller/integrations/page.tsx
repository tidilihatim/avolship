import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { IntegrationsContainer } from './_components/integrations-container';
import { getIntegrationPlatforms, getUserIntegrations } from '@/app/actions/integrations';

export const metadata: Metadata = {
  title: 'Integrations | Avolship',
  description: 'Connect your e-commerce platforms and automate order fulfillment',
};

interface IntegrationsPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

export default async function IntegrationsPage({ searchParams }: IntegrationsPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const { error, success } = await searchParams;

  // Get selected warehouse from cookies
  const cookiesStore = await cookies();
  const warehouseId = cookiesStore.get('selectedWarehouse')?.value;
  
  if (!warehouseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold ">No Warehouse Selected</h2>
          <p className="text-muted-foreground mt-2">Please select a warehouse to view integrations.</p>
        </div>
      </div>
    );
  }

  // Fetch available platforms and user integrations using server actions
  const [platforms, userIntegrations] = await Promise.all([
    getIntegrationPlatforms(),
    getUserIntegrations(session.user.id, warehouseId)
  ]);

  return (
    <IntegrationsContainer 
      platforms={platforms}
      userIntegrations={userIntegrations}
      warehouseId={warehouseId}
      error={error}
      success={success}
    />
  );
}
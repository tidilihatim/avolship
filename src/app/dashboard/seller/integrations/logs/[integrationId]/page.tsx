import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { redirect } from 'next/navigation';
import { getWebhookLogs } from '@/app/actions/webhook-logs';
import { WebhookLogsContainer } from './_components/webhook-logs-container';
import { WebhookLogsLoading } from './_components/webhook-logs-loading';

interface PageProps {
  params: Promise<{ integrationId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    platform?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }>;
}

export default async function WebhookLogsPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  const { integrationId } = await params;
  const searchParamsResolved = await searchParams;

  const page = parseInt(searchParamsResolved.page || '1');
  const limit = parseInt(searchParamsResolved.limit || '20');
  const filters = {
    status: searchParamsResolved.status as any,
    platform: searchParamsResolved.platform,
    dateFrom: searchParamsResolved.dateFrom,
    dateTo: searchParamsResolved.dateTo,
    search: searchParamsResolved.search
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<WebhookLogsLoading />}>
        <WebhookLogsContainer 
          integrationId={integrationId}
          initialPage={page}
          initialLimit={limit}
          initialFilters={filters}
        />
      </Suspense>
    </div>
  );
}
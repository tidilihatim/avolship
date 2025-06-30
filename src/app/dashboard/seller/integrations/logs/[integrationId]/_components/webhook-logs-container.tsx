'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getWebhookLogs, WebhookLogsFilters, WebhookLogsResponse } from '@/app/actions/webhook-logs';
import { WebhookLogsHeader } from './webhook-logs-header';
import { WebhookLogsStats } from './webhook-logs-stats';
import { WebhookLogsFilters as FiltersComponent } from './webhook-logs-filters';
import { WebhookLogsList } from './webhook-logs-list';
import { WebhookLogsPagination } from './webhook-logs-pagination';
import { WebhookLogsLoading } from './webhook-logs-loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface WebhookLogsContainerProps {
  integrationId: string;
  initialPage: number;
  initialLimit: number;
  initialFilters: WebhookLogsFilters;
}

export function WebhookLogsContainer({
  integrationId,
  initialPage,
  initialLimit,
  initialFilters
}: WebhookLogsContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WebhookLogsResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<WebhookLogsFilters>(initialFilters);

  const fetchLogs = async (currentPage: number, currentLimit: number, currentFilters: WebhookLogsFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWebhookLogs(integrationId, currentPage, currentLimit, currentFilters);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (newPage: number, newLimit: number, newFilters: WebhookLogsFilters) => {
    const params = new URLSearchParams();
    
    if (newPage > 1) params.set('page', newPage.toString());
    if (newLimit !== 20) params.set('limit', newLimit.toString());
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.platform) params.set('platform', newFilters.platform);
    if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom);
    if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo);
    if (newFilters.search) params.set('search', newFilters.search);

    const newURL = params.toString() 
      ? `?${params.toString()}`
      : window.location.pathname;
    
    router.push(newURL, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL(newPage, limit, filters);
    fetchLogs(newPage, limit, filters);
  };

  const handleLimitChange = (newLimit: number) => {
    const newPage = 1; // Reset to first page when changing limit
    setPage(newPage);
    setLimit(newLimit);
    updateURL(newPage, newLimit, filters);
    fetchLogs(newPage, newLimit, filters);
  };

  const handleFiltersChange = (newFilters: WebhookLogsFilters) => {
    const newPage = 1; // Reset to first page when filtering
    setPage(newPage);
    setFilters(newFilters);
    updateURL(newPage, limit, newFilters);
    fetchLogs(newPage, limit, newFilters);
  };

  const handleRefresh = () => {
    fetchLogs(page, limit, filters);
  };

  useEffect(() => {
    fetchLogs(page, limit, filters);
  }, [integrationId]);

  if (loading && !data) {
    return <WebhookLogsLoading />;
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <WebhookLogsHeader integrationId={integrationId} />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <WebhookLogsHeader integrationId={integrationId} />
        <div className="text-center py-12">
          <p className="text-muted-foreground">No logs found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WebhookLogsHeader 
        integrationId={integrationId}
        onRefresh={handleRefresh}
        loading={loading}
      />
      
      <WebhookLogsStats stats={data.stats} />
      
      <FiltersComponent 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />
      
      <WebhookLogsList 
        logs={data.logs}
        loading={loading}
      />
      
      <WebhookLogsPagination
        pagination={data.pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        loading={loading}
      />
    </div>
  );
}
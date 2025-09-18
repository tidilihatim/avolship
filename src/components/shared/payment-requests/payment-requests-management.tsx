"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Filter, RefreshCw, Clock, CheckCircle, XCircle, Calendar, AlertCircle } from 'lucide-react';
import { PaymentRequestStatus, PaymentRequestPriority } from '@/lib/db/models/payment-request';
import { PaymentRequestsList } from './payment-requests-list';
import { PaymentRequestDetails } from './payment-request-details';
import { PaymentRequestActions } from './payment-request-actions';

interface PaymentRequest {
  _id: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
    businessName?: string;
  };
  warehouseId: {
    _id: string;
    name: string;
    country: string;
    city: string;
    currency: string;
  };
  requestedAmount: number;
  description: string;
  requestedFromDate: string;
  requestedToDate: string;
  scheduledDate?: string;
  processedDate?: string;
  status: PaymentRequestStatus;
  priority: PaymentRequestPriority;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaymentRequestsManagementProps {
  userRole: 'admin' | 'moderator';
  fetchRequestsAction: (params: any) => Promise<any>;
  updateRequestStatusAction: (data: any) => Promise<any>;
}

export const PaymentRequestsManagement: React.FC<PaymentRequestsManagementProps> = ({
  userRole,
  fetchRequestsAction,
  updateRequestStatusAction,
}) => {
  const t = useTranslations('paymentRequests');
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showActions, setShowActions] = useState(false);

  // Server-side filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined as PaymentRequestStatus | undefined,
    priority: undefined as PaymentRequestPriority | undefined,
    search: '',
    warehouseId: undefined as string | undefined,
  });

  useEffect(() => {
    const initializeData = async () => {
      setInitialLoading(true);
      await fetchData();
      setInitialLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      fetchData();
    }
  }, [filters, initialLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const result = await fetchRequestsAction({
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        priority: filters.priority,
        search: filters.search,
        warehouseId: filters.warehouseId,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (result.success) {
        setPaymentRequests(result.data || []);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } else {
        toast.error(result.error || t('messages.fetchError'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: PaymentRequestStatus, data?: any) => {
    try {
      const result = await updateRequestStatusAction({
        requestId,
        status,
        ...data,
      });

      if (result.success) {
        toast.success(result.message || t('messages.updateSuccess'));
        await fetchData();
        setShowActions(false);
        setSelectedRequest(null);
      } else {
        toast.error(result.error || t('messages.updateError'));
      }
    } catch (error) {
      toast.error(t('messages.updateError'));
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    let status: PaymentRequestStatus | undefined;

    switch (tab) {
      case 'pending':
        status = PaymentRequestStatus.PENDING;
        break;
      case 'approved':
        status = PaymentRequestStatus.APPROVED;
        break;
      case 'scheduled':
        status = PaymentRequestStatus.SCHEDULED;
        break;
      case 'processed':
        status = PaymentRequestStatus.PROCESSED;
        break;
      case 'rejected':
        status = PaymentRequestStatus.REJECTED;
        break;
      default:
        status = undefined;
    }

    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handlePriorityFilter = (priority: PaymentRequestPriority | undefined) => {
    setFilters(prev => ({ ...prev, priority, page: 1 }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const getStatusBadgeVariant = (status: PaymentRequestStatus) => {
    switch (status) {
      case PaymentRequestStatus.PENDING:
        return 'secondary';
      case PaymentRequestStatus.APPROVED:
        return 'default';
      case PaymentRequestStatus.SCHEDULED:
        return 'secondary';
      case PaymentRequestStatus.PROCESSED:
        return 'default';
      case PaymentRequestStatus.REJECTED:
        return 'destructive';
      case PaymentRequestStatus.CANCELLED:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: PaymentRequestStatus) => {
    switch (status) {
      case PaymentRequestStatus.PENDING:
        return <Clock className="w-3 h-3" />;
      case PaymentRequestStatus.APPROVED:
        return <CheckCircle className="w-3 h-3" />;
      case PaymentRequestStatus.SCHEDULED:
        return <Calendar className="w-3 h-3" />;
      case PaymentRequestStatus.PROCESSED:
        return <CheckCircle className="w-3 h-3" />;
      case PaymentRequestStatus.REJECTED:
        return <XCircle className="w-3 h-3" />;
      case PaymentRequestStatus.CANCELLED:
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  // Show initial loading screen
  if (initialLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex space-x-4">
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>

        {/* Table Skeleton */}
        <div className="rounded-md border">
          <div className="p-6">
            <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded mb-6" />

            {/* Tabs Skeleton */}
            <div className="flex space-x-2 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded" />
              ))}
            </div>

            {/* Table Content Skeleton */}
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-8 gap-4">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="h-8 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('management.title')}</h1>
          <p className="text-muted-foreground">
            {t('management.description')}
          </p>
        </div>
        <Button
          onClick={() => fetchData()}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('actions.refresh')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t('filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={filters.priority || 'all'}
          onValueChange={(value) =>
            handlePriorityFilter(value === 'all' ? undefined : value as PaymentRequestPriority)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('filters.priority')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allPriorities')}</SelectItem>
            <SelectItem value={PaymentRequestPriority.URGENT}>{t('form.priorities.urgent')}</SelectItem>
            <SelectItem value={PaymentRequestPriority.HIGH}>{t('form.priorities.high')}</SelectItem>
            <SelectItem value={PaymentRequestPriority.NORMAL}>{t('form.priorities.normal')}</SelectItem>
            <SelectItem value={PaymentRequestPriority.LOW}>{t('form.priorities.low')}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.limit.toString()}
          onValueChange={(value) => handleLimitChange(parseInt(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 per page</SelectItem>
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('management.listTitle')}</CardTitle>
          <CardDescription>
            {t('management.listDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
              <TabsTrigger value="pending">{t('tabs.pending')}</TabsTrigger>
              <TabsTrigger value="approved">{t('tabs.approved')}</TabsTrigger>
              <TabsTrigger value="scheduled">{t('tabs.scheduled')}</TabsTrigger>
              <TabsTrigger value="processed">{t('tabs.processed')}</TabsTrigger>
              <TabsTrigger value="rejected">{t('tabs.rejected')}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <PaymentRequestsList
                requests={paymentRequests}
                pagination={pagination}
                loading={loading}
                onViewDetails={(request) => {
                  setSelectedRequest(request);
                  setShowActions(false);
                }}
                onProcessRequest={(request) => {
                  setSelectedRequest(request);
                  setShowActions(true);
                }}
                onPageChange={handlePageChange}
                getStatusBadgeVariant={getStatusBadgeVariant}
                getStatusIcon={getStatusIcon}
                userRole={userRole}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Request Details Dialog */}
      {selectedRequest && !showActions && (
        <PaymentRequestDetails
          request={selectedRequest}
          open={!!selectedRequest && !showActions}
          onClose={() => setSelectedRequest(null)}
          onProcessRequest={() => setShowActions(true)}
          getStatusBadgeVariant={getStatusBadgeVariant}
          getStatusIcon={getStatusIcon}
          userRole={userRole}
        />
      )}

      {/* Payment Request Actions Dialog */}
      {selectedRequest && showActions && (
        <PaymentRequestActions
          request={selectedRequest}
          open={showActions}
          onClose={() => {
            setShowActions(false);
            setSelectedRequest(null);
          }}
          onUpdateStatus={handleUpdateStatus}
          userRole={userRole}
        />
      )}
    </div>
  );
};
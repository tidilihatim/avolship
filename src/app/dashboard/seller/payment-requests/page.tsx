"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, AlertCircle, Receipt, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { CreatePaymentRequestDialog } from './_components/create-payment-request-dialog';
import { PaymentRequestsList } from './_components/payment-requests-list';
import { PaymentRequestDetails } from './_components/payment-request-details';
import {
  getSellerPaymentRequests,
  cancelPaymentRequest
} from '@/app/actions/payment-requests';
import { getAppSettings } from '@/app/actions/app-settings';
import { PaymentRequestStatus } from '@/lib/db/models/payment-request';

interface PaymentRequest {
  _id: string;
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
  priority: string;
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

const PaymentRequestsPage = () => {
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
  const [canCreateRequests, setCanCreateRequests] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Server-side filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined as PaymentRequestStatus | undefined,
    search: '',
  });

  useEffect(() => {
    const initializeData = async () => {
      setInitialLoading(true);
      await Promise.all([
        fetchSettings(),
        fetchData()
      ]);
      setInitialLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      fetchData();
    }
  }, [filters, initialLoading]);

  const fetchSettings = async () => {
    try {
      // Check if payment requests are enabled
      const settingsResult = await getAppSettings();
      if (settingsResult.success && settingsResult.data) {
        setCanCreateRequests(settingsResult.data.canSellerRequestPayments);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch payment requests with server-side pagination
      const requestsResult = await getSellerPaymentRequests({
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        search: filters.search,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (requestsResult.success) {
        setPaymentRequests(requestsResult.data || []);
        if (requestsResult.pagination) {
          setPagination(requestsResult.pagination);
        }
      } else {
        toast.error(requestsResult.error || t('messages.fetchError'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (success: boolean) => {
    if (success) {
      setShowCreateDialog(false);
      // Reset to first page and refresh data after creating a new request
      setFilters(prev => ({ ...prev, page: 1 }));
      // Force a refresh immediately
      await fetchData();
      toast.success(t('messages.createSuccess'));
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const result = await cancelPaymentRequest(requestId);
      if (result.success) {
        toast.success(t('messages.cancelSuccess'));
        // Refresh data immediately after canceling
        await fetchData();
      } else {
        toast.error(result.error || t('messages.cancelError'));
      }
    } catch (error) {
      toast.error(t('messages.cancelError'));
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
      case 'rejected':
        status = PaymentRequestStatus.REJECTED;
        break;
      default:
        status = undefined;
    }

    setFilters(prev => ({ ...prev, status, page: 1 }));
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

  // Stats will be calculated server-side based on current filters
  const currentCount = pagination.totalItems;

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

        {/* Table Skeleton */}
        <div className="rounded-md border">
          <div className="p-6">
            <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded mb-6" />

            {/* Tabs Skeleton */}
            <div className="flex space-x-2 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-16 bg-muted animate-pulse rounded" />
              ))}
            </div>

            {/* Table Headers Skeleton */}
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
              {/* Table Rows Skeleton */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-4">
                  {Array.from({ length: 7 }).map((_, j) => (
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
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          disabled={!canCreateRequests}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('actions.newRequest')}
        </Button>
      </div>

      {/* Disabled Message */}
      {!canCreateRequests && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {t('disabledMessage')}
          </AlertDescription>
        </Alert>
      )}


      {/* Payment Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('list.title')}</CardTitle>
          <CardDescription>
            {t('list.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">{t('tabs.all')} ({pagination.totalItems})</TabsTrigger>
              <TabsTrigger value="pending">{t('tabs.pending')}</TabsTrigger>
              <TabsTrigger value="approved">{t('tabs.approved')}</TabsTrigger>
              <TabsTrigger value="rejected">{t('tabs.rejected')}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <PaymentRequestsList
                requests={paymentRequests}
                pagination={pagination}
                loading={loading}
                onViewDetails={setSelectedRequest}
                onCancel={handleCancelRequest}
                onPageChange={handlePageChange}
                getStatusBadgeVariant={getStatusBadgeVariant}
                getStatusIcon={getStatusIcon}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Payment Request Dialog */}
      <CreatePaymentRequestDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateRequest}
      />

      {/* Payment Request Details Dialog */}
      {selectedRequest && (
        <PaymentRequestDetails
          request={selectedRequest}
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          getStatusBadgeVariant={getStatusBadgeVariant}
          getStatusIcon={getStatusIcon}
        />
      )}
    </div>
  );
};

export default PaymentRequestsPage;
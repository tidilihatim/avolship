"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import { PaymentRequestStatus, PaymentRequestPriority } from '@/lib/db/models/payment-request';
import { PaymentRequestDetailsContent } from '@/components/shared/payment-requests/payment-request-details-content';
import { PaymentRequestActions } from '@/components/shared/payment-requests/payment-request-actions';
import { getPaymentRequestById, updatePaymentRequestStatus } from '@/app/actions/payment-requests';

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

const AdminPaymentRequestDetailsPage = () => {
  const t = useTranslations('paymentRequests');
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (requestId) {
      fetchPaymentRequest();
    }
  }, [requestId]);

  const fetchPaymentRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPaymentRequestById(requestId);

      if (result.success && result.data) {
        setRequest(result.data);
      } else {
        setError(result.error || t('messages.fetchError'));
      }
    } catch (error) {
      console.error('Error fetching payment request:', error);
      setError(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: PaymentRequestStatus, data?: any) => {
    try {
      const result = await updatePaymentRequestStatus({
        requestId,
        status,
        ...data,
      });

      if (result.success) {
        toast.success(result.message || t('messages.updateSuccess'));
        await fetchPaymentRequest(); // Refresh the data
        setShowActions(false);
      } else {
        toast.error(result.error || t('messages.updateError'));
      }
    } catch (error) {
      toast.error(t('messages.updateError'));
    }
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

  const canProcessRequest = () => {
    return request?.status === PaymentRequestStatus.PENDING;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/admin/payment-requests')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('management.details.title')}</h1>
            <p className="text-muted-foreground">
              {t('management.details.description')}
            </p>
          </div>
        </div>

        {/* Error State */}
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-medium mb-2">{t('management.details.notFound')}</h3>
          <p className="text-muted-foreground mb-4">
            {error || t('management.details.notFoundDescription')}
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/admin/payment-requests')}
            >
              {t('management.details.backToList')}
            </Button>
            <Button onClick={fetchPaymentRequest}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('actions.refresh')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/admin/payment-requests')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('management.details.title')}</h1>
            <p className="text-muted-foreground">
              {t('management.details.description')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={getStatusBadgeVariant(request.status)} className="gap-1">
            {getStatusIcon(request.status)}
            {t(`status.${request.status}`)}
          </Badge>
          {canProcessRequest() && (
            <Button onClick={() => setShowActions(true)} className="gap-2">
              <Settings className="w-4 h-4" />
              {t('actions.processRequest')}
            </Button>
          )}
        </div>
      </div>

      {/* Payment Request Details */}
      <PaymentRequestDetailsContent
        request={request}
        onProcessRequest={() => setShowActions(true)}
        getStatusBadgeVariant={getStatusBadgeVariant}
        getStatusIcon={getStatusIcon}
        userRole="admin"
      />

      {/* Payment Request Actions Dialog */}
      {showActions && (
        <PaymentRequestActions
          request={request}
          open={showActions}
          onClose={() => setShowActions(false)}
          onUpdateStatus={handleUpdateStatus}
          userRole="admin"
        />
      )}
    </div>
  );
};

export default AdminPaymentRequestDetailsPage;
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building,
  Settings,
} from 'lucide-react';
import { PaymentRequestStatus, PaymentRequestPriority } from '@/lib/db/models/payment-request';
import { formatPrice } from '@/lib/utils';

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

interface PaymentRequestDetailsContentProps {
  request: PaymentRequest;
  onProcessRequest?: () => void;
  getStatusBadgeVariant: (status: PaymentRequestStatus) => 'default' | 'secondary' | 'destructive' | 'outline';
  getStatusIcon: (status: PaymentRequestStatus) => React.ReactNode;
  userRole: 'admin' | 'moderator';
}

export const PaymentRequestDetailsContent: React.FC<PaymentRequestDetailsContentProps> = ({
  request,
  onProcessRequest,
  getStatusBadgeVariant,
  getStatusIcon,
  userRole,
}) => {
  const t = useTranslations('paymentRequests');

  const getPriorityColor = (priority: PaymentRequestPriority) => {
    switch (priority) {
      case PaymentRequestPriority.URGENT:
        return 'text-red-600 bg-red-50 border-red-200';
      case PaymentRequestPriority.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case PaymentRequestPriority.NORMAL:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case PaymentRequestPriority.LOW:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusTimeline = () => {
    const timeline = [
      {
        status: 'created',
        date: request.createdAt,
        icon: <FileText className="w-4 h-4" />,
        completed: true,
      },
      {
        status: 'pending',
        date: request.createdAt,
        icon: <Clock className="w-4 h-4" />,
        completed: true,
      },
    ];

    if (request.status === PaymentRequestStatus.APPROVED) {
      timeline.push({
        status: 'approved',
        date: request.reviewedAt || '',
        icon: <CheckCircle className="w-4 h-4" />,
        completed: true,
      });
    }

    if (request.status === PaymentRequestStatus.SCHEDULED) {
      timeline.push({
        status: 'approved',
        date: request.reviewedAt || '',
        icon: <CheckCircle className="w-4 h-4" />,
        completed: true,
      });
      timeline.push({
        status: 'scheduled',
        date: request.scheduledDate || '',
        icon: <Calendar className="w-4 h-4" />,
        completed: true,
      });
    }

    if (request.status === PaymentRequestStatus.PROCESSED) {
      timeline.push({
        status: 'approved',
        date: request.reviewedAt || '',
        icon: <CheckCircle className="w-4 h-4" />,
        completed: true,
      });
      if (request.scheduledDate) {
        timeline.push({
          status: 'scheduled',
          date: request.scheduledDate,
          icon: <Calendar className="w-4 h-4" />,
          completed: true,
        });
      }
      timeline.push({
        status: 'processed',
        date: request.processedDate || '',
        icon: <CheckCircle className="w-4 h-4" />,
        completed: true,
      });
    }

    if (request.status === PaymentRequestStatus.REJECTED) {
      timeline.push({
        status: 'rejected',
        date: request.reviewedAt || '',
        icon: <XCircle className="w-4 h-4" />,
        completed: true,
      });
    }

    if (request.status === PaymentRequestStatus.CANCELLED) {
      timeline.push({
        status: 'cancelled',
        date: request.updatedAt,
        icon: <XCircle className="w-4 h-4" />,
        completed: true,
      });
    }

    return timeline;
  };

  const canProcessRequest = () => {
    return request.status === PaymentRequestStatus.PENDING && onProcessRequest;
  };

  return (
    <div className="space-y-6">
      {/* Status and Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('management.details.overview')}</CardTitle>
            <Badge variant={getStatusBadgeVariant(request.status)} className="gap-1">
              {getStatusIcon(request.status)}
              {t(`status.${request.status}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>{t('management.details.requestedAmount')}</span>
              </div>
              <div className="text-2xl font-bold">
                {formatPrice(request.requestedAmount, request.warehouseId.currency)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>{t('management.details.priority')}</span>
              </div>
              <div className={`inline-block px-2 py-1 rounded-md text-sm font-medium border ${getPriorityColor(request.priority)}`}>
                {t(`form.priorities.${request.priority.toLowerCase()}`)}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{t('management.details.dateRange')}</span>
              </div>
              <div className="font-medium">
                {format(new Date(request.requestedFromDate), 'MMMM dd, yyyy')} - {format(new Date(request.requestedToDate), 'MMMM dd, yyyy')}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{t('management.details.createdOn')}</span>
              </div>
              <div className="font-medium">
                {format(new Date(request.createdAt), 'MMMM dd, yyyy HH:mm')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seller Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{t('management.details.sellerInfo')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="font-medium text-lg">{request.sellerId.name}</div>
            <div className="text-muted-foreground">{request.sellerId.email}</div>
            {request.sellerId.businessName && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('management.details.businessName')}: </span>
                <span className="font-medium">{request.sellerId.businessName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>{t('management.details.warehouseInfo')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="font-medium text-lg">{request.warehouseId.name}</div>
            <div className="text-muted-foreground">
              {request.warehouseId.city}, {request.warehouseId.country}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">{t('management.details.currency')}: </span>
              <span className="font-medium">{request.warehouseId.currency}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>{t('management.details.description')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{request.description}</p>
        </CardContent>
      </Card>

      {/* Review Information */}
      {(request.reviewedBy || request.rejectionReason) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>{t('management.details.reviewInfo')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.reviewedBy && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('management.details.reviewedBy')}</div>
                <div className="font-medium">{request.reviewedBy.name}</div>
                <div className="text-sm text-muted-foreground">{request.reviewedBy.email}</div>
                {request.reviewedAt && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {t('management.details.reviewedOn')} {format(new Date(request.reviewedAt), 'MMMM dd, yyyy HH:mm')}
                  </div>
                )}
              </div>
            )}

            {request.reviewNotes && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('management.details.reviewNotes')}</div>
                <div className="text-sm p-3 bg-muted rounded-lg">
                  {request.reviewNotes}
                </div>
              </div>
            )}

            {request.rejectionReason && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('management.details.rejectionReason')}</div>
                <div className="text-sm p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  {request.rejectionReason}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Important Dates */}
      {(request.scheduledDate || request.processedDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('management.details.importantDates')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.scheduledDate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('management.details.scheduledDate')}</span>
                </div>
                <div className="font-medium">
                  {format(new Date(request.scheduledDate), 'MMMM dd, yyyy')}
                </div>
              </div>
            )}
            {request.processedDate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">{t('management.details.processedDate')}</span>
                </div>
                <div className="font-medium">
                  {format(new Date(request.processedDate), 'MMMM dd, yyyy HH:mm')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('management.details.statusTimeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getStatusTimeline().map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  item.completed
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-muted-foreground text-muted-foreground'
                }`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium capitalize">
                    {t(`management.details.timeline.${item.status}`)}
                  </div>
                  {item.date && (
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(item.date), 'MMMM dd, yyyy HH:mm')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
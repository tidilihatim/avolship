"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  MapPin,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
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

interface PaymentRequestDetailsProps {
  request: PaymentRequest;
  open: boolean;
  onClose: () => void;
  getStatusBadgeVariant: (status: PaymentRequestStatus) => 'default' | 'secondary' | 'destructive' | 'outline';
  getStatusIcon: (status: PaymentRequestStatus) => React.ReactNode;
}

export const PaymentRequestDetails: React.FC<PaymentRequestDetailsProps> = ({
  request,
  open,
  onClose,
  getStatusBadgeVariant,
  getStatusIcon,
}) => {
  const t = useTranslations('paymentRequests');

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialog.details.title')}</DialogTitle>
          <DialogDescription>
            {t('dialog.details.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Request Overview</CardTitle>
                <Badge variant={getStatusBadgeVariant(request.status)} className="gap-1">
                  {getStatusIcon(request.status)}
                  {t(`status.${request.status}`)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span>Priority</span>
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
                    <span>Requested Date Range</span>
                  </div>
                  <div className="font-medium">
                    {format(new Date(request.requestedFromDate), 'MMMM dd, yyyy')} - {format(new Date(request.requestedToDate), 'MMMM dd, yyyy')}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Created On</span>
                  </div>
                  <div className="font-medium">
                    {format(new Date(request.createdAt), 'MMMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Warehouse Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-medium text-lg">{request.warehouseId.name}</div>
                <div className="text-muted-foreground">
                  {request.warehouseId.city}, {request.warehouseId.country}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Currency: </span>
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
                <span>Description</span>
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
                  <span>Review Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.reviewedBy && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Reviewed By</div>
                    <div className="font-medium">{request.reviewedBy.name}</div>
                    <div className="text-sm text-muted-foreground">{request.reviewedBy.email}</div>
                    {request.reviewedAt && (
                      <div className="text-sm text-muted-foreground mt-1">
                        on {format(new Date(request.reviewedAt), 'MMMM dd, yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                )}

                {request.reviewNotes && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Review Notes</div>
                    <div className="text-sm p-3 bg-muted rounded-lg">
                      {request.reviewNotes}
                    </div>
                  </div>
                )}

                {request.rejectionReason && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Rejection Reason</div>
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
                <CardTitle className="text-lg">Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.scheduledDate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Scheduled Date</span>
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
                      <span className="text-sm text-muted-foreground">Processed Date</span>
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
              <CardTitle className="text-lg">Status Timeline</CardTitle>
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
                        {item.status.replace('_', ' ')}
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
      </DialogContent>
    </Dialog>
  );
};
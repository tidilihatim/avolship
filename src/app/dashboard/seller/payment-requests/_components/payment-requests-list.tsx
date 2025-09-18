"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Eye,
  X,
  Calendar,
  MapPin,
  DollarSign,
  Clock
} from 'lucide-react';
import { PaymentRequestStatus } from '@/lib/db/models/payment-request';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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

interface PaymentRequestsListProps {
  requests: PaymentRequest[];
  pagination: Pagination;
  loading?: boolean;
  onViewDetails: (request: PaymentRequest) => void;
  onCancel: (requestId: string) => void;
  onPageChange: (page: number) => void;
  getStatusBadgeVariant: (status: PaymentRequestStatus) => 'default' | 'secondary' | 'destructive' | 'outline';
  getStatusIcon: (status: PaymentRequestStatus) => React.ReactNode;
}

export const PaymentRequestsList: React.FC<PaymentRequestsListProps> = ({
  requests,
  pagination,
  loading = false,
  onViewDetails,
  onCancel,
  onPageChange,
  getStatusBadgeVariant,
  getStatusIcon,
}) => {
  const t = useTranslations('paymentRequests');
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);

  // Server-side pagination - no client-side slicing needed
  const currentRequests = requests;

  const canCancel = (request: PaymentRequest) => {
    return request.status === PaymentRequestStatus.PENDING;
  };

  const handleCancelConfirm = () => {
    if (cancelRequestId) {
      onCancel(cancelRequestId);
      setCancelRequestId(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (requests.length === 0) {
    return (
      <Card className="p-12 text-center">
        <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No Payment Requests</h3>
        <p className="text-muted-foreground mb-4">
          You haven't created any payment requests yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                currentRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{request.warehouseId.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.warehouseId.city}, {request.warehouseId.country}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">
                          {formatPrice(request.requestedAmount, request.warehouseId.currency)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)} className="gap-1">
                        {getStatusIcon(request.status)}
                        {t(`status.${request.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={getPriorityColor(request.priority)}>
                        {t(`form.priorities.${request.priority.toLowerCase()}`)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div>{format(new Date(request.requestedFromDate), 'MMM dd, yyyy')}</div>
                          <div className="text-muted-foreground">to {format(new Date(request.requestedToDate), 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(request.createdAt), 'MMM dd')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(request)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {t('actions.viewDetails')}
                          </DropdownMenuItem>
                          {canCancel(request) && (
                            <DropdownMenuItem
                              onClick={() => setCancelRequestId(request._id)}
                              className="text-destructive"
                            >
                              <X className="w-4 h-4 mr-2" />
                              {t('actions.cancel')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          // Skeleton loading cards
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`mobile-skeleton-${index}`} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm mb-3">
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </Card>
          ))
        ) : (
          currentRequests.map((request) => (
            <Card key={request._id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-sm">{request.warehouseId.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {request.warehouseId.city}, {request.warehouseId.country}
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(request.status)} className="gap-1">
                  {getStatusIcon(request.status)}
                  {t(`status.${request.status}`)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <div className="text-muted-foreground">Amount</div>
                  <div className="font-medium">
                    {formatPrice(request.requestedAmount, request.warehouseId.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Priority</div>
                  <div className={getPriorityColor(request.priority)}>
                    {t(`form.priorities.${request.priority.toLowerCase()}`)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm mb-3">
                <div>
                  <div className="text-muted-foreground">Date Range</div>
                  <div>
                    {format(new Date(request.requestedFromDate), 'MMM dd, yyyy')} - {format(new Date(request.requestedToDate), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(request)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                {canCancel(request) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelRequestId(request._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Server-side Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of {pagination.totalItems} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const page = pagination.currentPage <= 3
                  ? i + 1
                  : pagination.currentPage + i - 2;
                if (page > pagination.totalPages) return null;
                return (
                  <Button
                    key={page}
                    variant={pagination.currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="w-8"
                  >
                    {page}
                  </Button>
                );
              }).filter(Boolean)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelRequestId} onOpenChange={() => setCancelRequestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Payment Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this payment request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
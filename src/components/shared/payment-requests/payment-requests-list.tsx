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
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Eye,
  Settings,
  Calendar,
  MapPin,
  User,
  Building,
  Clock
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
  onProcessRequest: (request: PaymentRequest) => void;
  onPageChange: (page: number) => void;
  getStatusBadgeVariant: (status: PaymentRequestStatus) => 'default' | 'secondary' | 'destructive' | 'outline';
  getStatusIcon: (status: PaymentRequestStatus) => React.ReactNode;
  userRole: 'admin' | 'moderator';
}

export const PaymentRequestsList: React.FC<PaymentRequestsListProps> = ({
  requests,
  pagination,
  loading = false,
  onViewDetails,
  onProcessRequest,
  onPageChange,
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

  const canProcessRequest = (request: PaymentRequest) => {
    return request.status === PaymentRequestStatus.PENDING;
  };

  if (requests.length === 0 && !loading) {
    return (
      <Card className="p-12 text-center">
        <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">{t('management.noRequests')}</h3>
        <p className="text-muted-foreground mb-4">
          {t('management.noRequestsDescription')}
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
                <TableHead>{t('management.table.seller')}</TableHead>
                <TableHead>{t('management.table.warehouse')}</TableHead>
                <TableHead>{t('management.table.amount')}</TableHead>
                <TableHead>{t('management.table.status')}</TableHead>
                <TableHead>{t('management.table.priority')}</TableHead>
                <TableHead>{t('management.table.dateRange')}</TableHead>
                <TableHead>{t('management.table.created')}</TableHead>
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
                      <div>
                        <Skeleton className="h-4 w-28 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
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
                requests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{request.sellerId.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.sellerId.businessName || request.sellerId.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
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
                      <div className="font-medium">
                        {formatPrice(request.requestedAmount, request.warehouseId.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)} className="gap-1">
                        {getStatusIcon(request.status)}
                        {t(`status.${request.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                        {t(`form.priorities.${request.priority.toLowerCase()}`)}
                      </div>
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
                          {canProcessRequest(request) && (
                            <DropdownMenuItem onClick={() => onProcessRequest(request)}>
                              <Settings className="w-4 h-4 mr-2" />
                              {t('actions.processRequest')}
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
              <div className="flex justify-end space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </Card>
          ))
        ) : (
          requests.map((request) => (
            <Card key={request._id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-sm">{request.sellerId.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {request.sellerId.businessName || request.sellerId.email}
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(request.status)} className="gap-1">
                  {getStatusIcon(request.status)}
                  {t(`status.${request.status}`)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <div className="text-muted-foreground">{t('management.table.warehouse')}</div>
                  <div className="font-medium">{request.warehouseId.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t('management.table.amount')}</div>
                  <div className="font-medium">
                    {formatPrice(request.requestedAmount, request.warehouseId.currency)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm mb-3">
                <div>
                  <div className="text-muted-foreground">{t('management.table.dateRange')}</div>
                  <div>
                    {format(new Date(request.requestedFromDate), 'MMM dd, yyyy')} - {format(new Date(request.requestedToDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(request)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {t('actions.view')}
                </Button>
                {canProcessRequest(request) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onProcessRequest(request)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    {t('actions.process')}
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
            {t('management.pagination.showing', {
              start: ((pagination.currentPage - 1) * pagination.limit) + 1,
              end: Math.min(pagination.currentPage * pagination.limit, pagination.totalItems),
              total: pagination.totalItems
            })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              {t('management.pagination.previous')}
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
              {t('management.pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
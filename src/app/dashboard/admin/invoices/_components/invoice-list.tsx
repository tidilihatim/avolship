'use client';

import React, { useState, useTransition } from 'react';
import { Search, FilterX, Filter, MoreHorizontal, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from "sonner";
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetClose
} from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';

import { InvoiceStatus } from '@/types/invoice';
import { updateInvoiceStatus } from '@/app/actions/invoice';

// Constants for filter values
const ALL_STATUSES = "all_statuses";
const ALL_SELLERS = "all_sellers";

interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  createdAt: Date;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  summary: {
    totalOrders: number;
    totalSales: number;
    totalFees: number;
    finalAmount: number;
    unpaidExpeditions: number;
    unpaidAmount: number;
  };
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
    currency: string;
  };
  generatedBy: {
    _id: string;
    name: string;
    email: string;
  };
}

interface InvoiceFilters {
  search: string;
  status: string;
  seller: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InvoiceListProps {
  invoices: InvoiceData[];
  pagination?: PaginationData;
  filters: InvoiceFilters;
}

export default function InvoiceList({ invoices, pagination, filters }: InvoiceListProps) {
  const t = useTranslations('invoices');
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  
  // State for search and filters
  const [search, setSearch] = useState(filters.search || '');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(filters.status || ALL_STATUSES);
  const [sellerFilter, setSellerFilter] = useState(filters.seller || ALL_SELLERS);
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const [itemsPerPage, setItemsPerPage] = useState<number>(filters.limit || 10);
  
  // Extract unique sellers for filter
  const uniqueSellers = Array.from(new Set(invoices.map(invoice => invoice.sellerId._id)))
    .map(sellerId => {
      const invoice = invoices.find(i => i.sellerId._id === sellerId);
      return invoice ? {
        id: sellerId,
        name: invoice.sellerId.name,
        businessName: invoice.sellerId.businessName
      } : null;
    })
    .filter(Boolean);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters({
      search: search || undefined,
      status: statusFilter !== ALL_STATUSES ? statusFilter : undefined,
      seller: sellerFilter !== ALL_SELLERS ? sellerFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
      limit: itemsPerPage
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    navigateWithFilters({
      search: search || undefined,
      status: statusFilter !== ALL_STATUSES ? statusFilter : undefined,
      seller: sellerFilter !== ALL_SELLERS ? sellerFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
      limit: itemsPerPage
    });
    setIsFiltersOpen(false);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setStatusFilter(ALL_STATUSES);
    setSellerFilter(ALL_SELLERS);
    setStartDate('');
    setEndDate('');
    navigateWithFilters({
      page: 1,
      limit: itemsPerPage
    });
    setIsFiltersOpen(false);
  };
  
  // Change page
  const handlePageChange = (page: number) => {
    navigateWithFilters({
      ...filters,
      page
    });
  };
  
  // Change items per page
  const handleItemsPerPageChange = (value: string) => {
    const limit = parseInt(value);
    setItemsPerPage(limit);
    navigateWithFilters({
      ...filters,
      page: 1,
      limit
    });
  };
  
  // Helper function to navigate with filters
  const navigateWithFilters = (newFilters: any) => {
    const params = new URLSearchParams();
    
    if (newFilters.search) params.append('search', newFilters.search);
    if (newFilters.status) params.append('status', newFilters.status);
    if (newFilters.seller) params.append('seller', newFilters.seller);
    if (newFilters.startDate) params.append('startDate', newFilters.startDate);
    if (newFilters.endDate) params.append('endDate', newFilters.endDate);
    if (newFilters.page) params.append('page', newFilters.page.toString());
    if (newFilters.limit) params.append('limit', newFilters.limit.toString());
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle status update
  const handleStatusUpdate = async (invoiceId: string, status: InvoiceStatus) => {
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, status);
      
      if (result.success) {
        toast.success(t('messages.statusUpdatedSuccess'));
        router.refresh();
      } else {
        toast.error(result.message || t('messages.statusUpdateFailed'));
      }
    });
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    if (!pagination) return null;
    
    const { page, totalPages } = pagination;
    const items = [];
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            if (page > 1) handlePageChange(page - 1);
          }}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    // First page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            handlePageChange(1);
          }}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (i <= 1 || i >= totalPages) continue;
      
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Last page (if more than one page)
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(totalPages);
            }}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            if (page < totalPages) handlePageChange(page + 1);
          }}
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    return items;
  };

  // Get status badge styling
  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = {
      [InvoiceStatus.DRAFT]: { label: t('statusLabels.DRAFT'), className: 'bg-muted text-muted-foreground' },
      [InvoiceStatus.GENERATED]: { label: t('statusLabels.GENERATED'), className: 'bg-primary/10 text-primary' },
      [InvoiceStatus.PAID]: { label: t('statusLabels.PAID'), className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      [InvoiceStatus.OVERDUE]: { label: t('statusLabels.OVERDUE'), className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
      [InvoiceStatus.CANCELLED]: { label: t('statusLabels.CANCELLED'), className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    };
    
    return statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="default">
            {t('applyFilters')}
          </Button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                {t('filters')}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-4">
              <SheetHeader className="px-1">
                <SheetTitle className="text-xl">{t('filters')}</SheetTitle>
                <SheetDescription className="text-sm">
                  {t('filtersDescription')}
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-8 space-y-8">
                {/* Status Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t('filterByStatus')}</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('allStatuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_STATUSES}>{t('allStatuses')}</SelectItem>
                      {Object.values(InvoiceStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusBadge(status).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Seller Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t('filterBySeller')}</Label>
                  <Select value={sellerFilter} onValueChange={setSellerFilter}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('allSellers')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_SELLERS}>{t('allSellers')}</SelectItem>
                      {uniqueSellers.map((seller) => (
                        <SelectItem key={seller?.id} value={seller?.id || ''}>
                          {seller?.businessName || seller?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t('dateRange')}</Label>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="start-date" className="text-xs">{t('startDate')}</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-xs">{t('endDate')}</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button onClick={applyFilters}>
                      {t('applyFilters')}
                    </Button>
                  </SheetClose>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    {t('clearFilters')}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {pagination?.total 
              ? `${pagination.total} ${pagination.total === 1 ? t('invoice') : t('invoices')} ${t('found')}`
              : t('noInvoicesFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoiceNumber')}</TableHead>
                    <TableHead>{t('seller')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('status')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('period')}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t('amount')}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t('warehouse')}</TableHead>
                    <TableHead className="hidden xl:table-cell">{t('generated')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.sellerId.businessName || invoice.sellerId.name}</div>
                          <div className="text-sm text-muted-foreground">{invoice.sellerId.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={getStatusBadge(invoice.status).className}>
                          {getStatusBadge(invoice.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          <div>{formatDate(invoice.periodStart)}</div>
                          <div className="text-muted-foreground">{t('to')} {formatDate(invoice.periodEnd)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(invoice.summary.finalAmount, invoice.currency)}</div>
                          <div className="text-muted-foreground">{invoice.summary.totalOrders} {t('orders')}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          <div>{invoice.warehouseId.name}</div>
                          <div className="text-muted-foreground">{invoice.warehouseId.country}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-sm">
                          <div>{formatDate(invoice.generatedAt)}</div>
                          <div className="text-muted-foreground">{t('by')} {invoice.generatedBy.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuItem className='cursor-pointer' asChild>
                              <Link href={`/dashboard/admin/invoices/${invoice._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('view')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            
                            {/* Status Actions */}
                            {invoice.status !== InvoiceStatus.PAID && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(invoice._id, InvoiceStatus.PAID)}
                              >
                                {t('markAsPaid')}
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== InvoiceStatus.OVERDUE && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(invoice._id, InvoiceStatus.OVERDUE)}
                              >
                                {t('markAsOverdue')}
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== InvoiceStatus.CANCELLED && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(invoice._id, InvoiceStatus.CANCELLED)}
                              >
                                {t('cancelInvoice')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                {t('noInvoicesFound')}
              </p>
            </div>
          )}
        </CardContent>
        {pagination && pagination.totalPages > 0 && (
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('itemsPerPage')}
              </span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Pagination>
              <PaginationContent>
                {renderPaginationItems()}
              </PaginationContent>
            </Pagination>
            
            <div className="text-sm text-muted-foreground">
              {t('showing', { 
                start: (pagination.page - 1) * pagination.limit + 1,
                end: Math.min(pagination.page * pagination.limit, pagination.total), 
                total: pagination.total 
              })}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
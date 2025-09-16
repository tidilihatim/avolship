'use client';

import React, { useState } from 'react';
import { Search, FilterX, Filter, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
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
import { Label } from '@/components/ui/label';

import { InvoiceStatus } from '@/types/invoice';

// Constants for filter values
const ALL_STATUSES = "all_statuses";

interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  createdAt: Date;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  // Seller-visible financial data (no sensitive processing fees)
  totalOrders: number;
  totalExpeditions: number;
  totalSales: number; // Seller's revenue
  totalExpeditionCosts: number; // Expedition costs they pay
  totalRefundAmount: number; // Refunds (reduces revenue)
  netAmount: number; // Final amount (positive = they receive, negative = they owe)
  // Warehouse info (flattened)
  warehouseName: string;
  warehouseCountry: string;
  // Additional info
  notes?: string;
}

interface InvoiceFilters {
  search: string;
  status: string;
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

interface SellerInvoiceListProps {
  invoices: InvoiceData[];
  pagination?: PaginationData;
  filters: InvoiceFilters;
}

export default function SellerInvoiceList({ invoices, pagination, filters }: SellerInvoiceListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('invoices');
  
  // State for search and filters
  const [search, setSearch] = useState(filters.search || '');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(filters.status || ALL_STATUSES);
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const [itemsPerPage, setItemsPerPage] = useState<number>(filters.limit || 10);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters({
      search: search || undefined,
      status: statusFilter !== ALL_STATUSES ? statusFilter : undefined,
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
    if (newFilters.startDate) params.append('startDate', newFilters.startDate);
    if (newFilters.endDate) params.append('endDate', newFilters.endDate);
    if (newFilters.page) params.append('page', newFilters.page.toString());
    if (newFilters.limit) params.append('limit', newFilters.limit.toString());
    
    router.push(`${pathname}?${params.toString()}`);
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
              placeholder={t('searchInvoices')}
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
                  {t('filterInvoices')}
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
              ? `${pagination.total} ${pagination.total === 1 ? t('invoicesFound.single') : t('invoicesFound.multiple')}`
              : t('noInvoicesFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.invoiceNumber')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('table.status')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('table.period')}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t('table.amount')}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t('table.warehouse')}</TableHead>
                    <TableHead className="hidden xl:table-cell">{t('table.generated')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={getStatusBadge(invoice.status).className}>
                          {getStatusBadge(invoice.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          <div>{formatDate(invoice.periodStart)}</div>
                          <div className="text-muted-foreground">{t('table.to')} {formatDate(invoice.periodEnd)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          <div className={`font-medium flex items-center gap-1 ${
                            invoice.netAmount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {formatCurrency(Math.abs(invoice.netAmount), invoice.currency)}
                            <Badge
                              variant={invoice.netAmount < 0 ? 'destructive' : 'secondary'}
                              className="text-xs px-1 py-0 h-5"
                            >
                              {invoice.netAmount < 0 ? 'DEBT' : 'PROFIT'}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground">{invoice.totalOrders} {t('table.orders')} • {invoice.totalExpeditions} expeditions</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          <div>{invoice.warehouseName}</div>
                          <div className="text-muted-foreground">{invoice.warehouseCountry}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-sm">
                          <div>{formatDate(invoice.generatedAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/seller/invoices/${invoice._id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              {t('table.view')}
                            </Link>
                          </Button>
                        </div>
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
                {t('pagination.itemsPerPage')}
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
              {t('pagination.showing')} {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} {t('pagination.of')} {pagination.total}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
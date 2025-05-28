'use client';

// src/app/[locale]/dashboard/seller/products/stock-history/[productId]/_components/stock-history-table.tsx
import { useState, useTransition, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, FilterX, Filter, Calendar, TrendingUp, TrendingDown, Package, History, User, MapPin, ArrowLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from "sonner";

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { StockMovementType, StockMovementReason } from '@/lib/db/models/stock-history';
import { StockHistoryTableData, StockHistoryFilters, StockSummaryData } from '@/types/stock-history';
import { UserRole } from '@/lib/db/models/user';
import { getLoginUserRole } from '@/app/actions/auth';
import { PaginationData } from '@/types/user';
import Link from 'next/link';

// Constants for filter values
const ALL_MOVEMENT_TYPES = "all_movement_types";
const ALL_REASONS = "all_reasons";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_USERS = "all_users";

interface WarehouseOption {
  _id: string;
  name: string;
  country: string;
}

interface UserOption {
  _id: string;
  name: string;
  role: string;
}

interface StockHistoryTableProps {
  stockHistory: StockHistoryTableData[];
  allWarehouses?: WarehouseOption[];
  allUsers?: UserOption[];
  pagination?: PaginationData;
  summary?: StockSummaryData;
  error?: string;
  filters: StockHistoryFilters & { 
    movementTypeFilter?: string;
    reasonFilter?: string;
    warehouseFilter?: string;
    userFilter?: string;
  };
  productId: string;
  productName: string;
}

/**
 * StockHistoryTable Component
 * Displays stock history with filtering, search, and pagination capabilities
 */
export default function StockHistoryTable({ 
  stockHistory, 
  allWarehouses = [], 
  allUsers = [],
  pagination, 
  summary,
  error, 
  filters,
  productId,
  productName
}: StockHistoryTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // State for search and filters
  const [search, setSearch] = useState(filters.search || '');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState(filters.movementTypeFilter || ALL_MOVEMENT_TYPES);
  const [reasonFilter, setReasonFilter] = useState(filters.reasonFilter || ALL_REASONS);
  const [warehouseFilter, setWarehouseFilter] = useState(filters.warehouseFilter || ALL_WAREHOUSES);
  const [userFilter, setUserFilter] = useState(filters.userFilter || ALL_USERS);
  const [itemsPerPage, setItemsPerPage] = useState<number>(filters.limit || 10);
  
  // Fetch current user role on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await getLoginUserRole();
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    
    fetchUserRole();
  }, []);
  
  // Check if user is admin or moderator
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
  
  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters({
      search: search || undefined,
      movementType: movementTypeFilter !== ALL_MOVEMENT_TYPES ? (movementTypeFilter as StockMovementType) : undefined,
      reason: reasonFilter !== ALL_REASONS ? (reasonFilter as StockMovementReason) : undefined,
      warehouseId: warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      userId: isAdminOrModerator && userFilter !== ALL_USERS ? userFilter : undefined,
      page: 1,
      limit: itemsPerPage
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    navigateWithFilters({
      search: search || undefined,
      movementType: movementTypeFilter !== ALL_MOVEMENT_TYPES ? (movementTypeFilter as StockMovementType) : undefined,
      reason: reasonFilter !== ALL_REASONS ? (reasonFilter as StockMovementReason) : undefined,
      warehouseId: warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      userId: isAdminOrModerator && userFilter !== ALL_USERS ? userFilter : undefined,
      page: 1,
      limit: itemsPerPage
    });
    setIsFiltersOpen(false);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setMovementTypeFilter(ALL_MOVEMENT_TYPES);
    setReasonFilter(ALL_REASONS);
    setWarehouseFilter(ALL_WAREHOUSES);
    setUserFilter(ALL_USERS);
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
    if (newFilters.movementType) params.append('movementType', newFilters.movementType);
    if (newFilters.reason) params.append('reason', newFilters.reason);
    if (newFilters.warehouseId) params.append('warehouseId', newFilters.warehouseId);
    if (newFilters.userId) params.append('userId', newFilters.userId);
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

  // Get movement type badge styling
  const getMovementTypeBadge = (movementType: StockMovementType) => {
    const config = {
      [StockMovementType.INCREASE]: { 
        label: t('stockHistory.movementTypes.increase'), 
        className: 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200',
        icon: TrendingUp
      },
      [StockMovementType.DECREASE]: { 
        label: t('stockHistory.movementTypes.decrease'), 
        className: 'bg-red-50 text-red-700 hover:bg-red-50 border-red-200',
        icon: TrendingDown
      }
    };
    
    return config[movementType] || { 
      label: t('common.unknown'), 
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200',
      icon: Package
    };
  };

  // Get localized reason description
  const getLocalizedReasonDescription = (reason: StockMovementReason) => {
    const reasonKey = `stockHistory.reasons.${reason}`;
    return t(reasonKey);
  };

  // Get reason badge color based on type
  const getReasonBadgeColor = (reason: StockMovementReason) => {
    const increaseReasons = [
      StockMovementReason.INITIAL_STOCK,
      StockMovementReason.RESTOCK,
      StockMovementReason.RETURN_FROM_CUSTOMER,
      StockMovementReason.WAREHOUSE_TRANSFER_IN,
      StockMovementReason.MANUAL_ADJUSTMENT_INCREASE,
      StockMovementReason.INVENTORY_CORRECTION_INCREASE,
    ];
    
    if (increaseReasons.includes(reason)) {
      return 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200';
    }
    
    return 'bg-red-50 text-red-700 hover:bg-red-50 border-red-200';
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Format stock difference
  const formatStockDifference = (difference: number) => {
    const prefix = difference > 0 ? '+' : '';
    return `${prefix}${difference}`;
  };
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('stockHistory.title')}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/seller/products" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('stockHistory.title')}</h1>
          <p className="text-muted-foreground">
            {productName} - {t('stockHistory.trackAllMovements')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stockHistory.totalMovements')}</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalMovements}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stockHistory.currentStock')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.currentStock}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stockHistory.stockIncreases')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.totalIncreases}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stockHistory.stockDecreases')}</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.totalDecreases}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t('stockHistory.searchStockHistory')}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="default">
            {t('common.search')}
          </Button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                {t('stockHistory.filters')}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-4">
              <SheetHeader className="px-1">
                <SheetTitle className="text-xl">{t('stockHistory.filters')}</SheetTitle>
                <SheetDescription className="text-sm">
                  {t('stockHistory.applyFiltersToHistory')}
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-8 space-y-8">
                {/* Movement Type Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">{t('stockHistory.filterByMovementType')}</h3>
                  <Select
                    value={movementTypeFilter}
                    onValueChange={setMovementTypeFilter}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('stockHistory.allMovementTypes')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_MOVEMENT_TYPES}>{t('stockHistory.allMovementTypes')}</SelectItem>
                      {Object.values(StockMovementType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getMovementTypeBadge(type).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reason Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">{t('stockHistory.filterByReason')}</h3>
                  <Select
                    value={reasonFilter}
                    onValueChange={setReasonFilter}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('stockHistory.allReasons')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_REASONS}>{t('stockHistory.allReasons')}</SelectItem>
                      {Object.values(StockMovementReason).map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {getLocalizedReasonDescription(reason)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Warehouse Filter */}
                {allWarehouses.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium leading-tight">{t('stockHistory.filterByWarehouse')}</h3>
                    <Select
                      value={warehouseFilter}
                      onValueChange={setWarehouseFilter}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={t('stockHistory.allWarehouses')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_WAREHOUSES}>{t('stockHistory.allWarehouses')}</SelectItem>
                        {allWarehouses.map((warehouse) => (
                          <SelectItem key={warehouse._id} value={warehouse._id}>
                            {warehouse.name} ({warehouse.country})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* User Filter (Admin/Moderator only) */}
                {isAdminOrModerator && allUsers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium leading-tight">{t('stockHistory.filterByUser')}</h3>
                    <Select
                      value={userFilter}
                      onValueChange={setUserFilter}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={t('stockHistory.allUsers')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_USERS}>{t('stockHistory.allUsers')}</SelectItem>
                        {allUsers.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button onClick={applyFilters}>
                      {t('products.applyFilters')}
                    </Button>
                  </SheetClose>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    {t('products.clearFilters')}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Stock History Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('stockHistory.stockMovementHistory')}</CardTitle>
          <CardDescription>
            {pagination?.total 
              ? t('stockHistory.movementsFound', { count: pagination.total })
              : t('stockHistory.noMovementsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stockHistory.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('stockHistory.dateTime')}</TableHead>
                    <TableHead>{t('stockHistory.type')}</TableHead>
                    <TableHead>{t('stockHistory.reason')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('common.warehouse')}</TableHead>
                    <TableHead className="text-right">{t('stockHistory.quantity')}</TableHead>
                    <TableHead className="text-right">{t('stockHistory.previous')}</TableHead>
                    <TableHead className="text-right">{t('stockHistory.newStock')}</TableHead>
                    <TableHead className="text-right">{t('stockHistory.change')}</TableHead>
                    {isAdminOrModerator && (
                      <TableHead className="hidden lg:table-cell">{t('stockHistory.user')}</TableHead>
                    )}
                    <TableHead className="hidden xl:table-cell">{t('stockHistory.notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockHistory.map((history) => {
                    const movementBadge = getMovementTypeBadge(history.movementType);
                    const MovementIcon = movementBadge.icon;
                    
                    return (
                      <TableRow key={history._id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {formatDate(history.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={movementBadge.className}>
                            <MovementIcon className="mr-1 h-3 w-3" />
                            {movementBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className={`${getReasonBadgeColor(history.reason)} cursor-help truncate max-w-[150px]`}
                                >
                                  {getLocalizedReasonDescription(history.reason)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getLocalizedReasonDescription(history.reason)}</p>
                                {history.orderId && (
                                  <p className="text-xs text-muted-foreground">
                                    {t('stockHistory.order')}: {history.orderCode || history.orderId}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[120px]">
                              {history.warehouseName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {history.quantity}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {history.previousStock}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {history.newStock}
                        </TableCell>
                        <TableCell className="text-right">
                          <span 
                            className={`font-medium ${
                              history.stockDifference > 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}
                          >
                            {formatStockDifference(history.stockDifference)}
                          </span>
                        </TableCell>
                        {isAdminOrModerator && (
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[100px]">
                                {history.userName}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="hidden xl:table-cell">
                          {history.notes ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-sm text-muted-foreground truncate max-w-[150px] cursor-help">
                                    {history.notes}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[300px]">{history.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50">
                <History className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground text-center">
                {t('stockHistory.noMovementsFound')}
              </p>
            </div>
          )}
        </CardContent>
        {pagination && pagination.totalPages > 0 && (
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('stockHistory.itemsPerPage')}:
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
              {t('stockHistory.showing')} {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} {t('stockHistory.of')} {pagination.total}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
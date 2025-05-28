"use client";

// src/app/[locale]/dashboard/expeditions/_components/expedition-table.tsx
import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  PlusCircle,
  Search,
  FilterX,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  Truck,
  Calendar,
  MapPin,
  Weight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
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
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ExpeditionStatus, TransportMode, ProviderType } from "@/app/dashboard/_constant/expedition";
import { ExpeditionTableData, ExpeditionFilters, WarehouseOption, SellerOption, ProviderOption } from "@/types/expedition";
import { updateExpeditionStatus } from "@/app/actions/expedition";
import { UserRole } from "@/lib/db/models/user";
import { PaginationData } from "@/types/user";

// Constants for filter values
const ALL_STATUSES = "all_statuses";
const ALL_TRANSPORT_MODES = "all_transport_modes";
const ALL_PROVIDER_TYPES = "all_provider_types";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";
const ALL_COUNTRIES = "all_countries";
const ALL_WEIGHT_LEVELS = "all_weight_levels";

interface ExpeditionTableProps {
  expeditions: ExpeditionTableData[];
  allWarehouses?: WarehouseOption[];
  allSellers?: SellerOption[];
  allProviders?: ProviderOption[];
  allCountries?: string[];
  pagination?: PaginationData;
  error?: string;
  filters: ExpeditionFilters & { 
    weightLevel?: string;
    transportMode?: string;
    providerType?: string;
  };
  currentUserRole?: UserRole; // Add this prop to receive user role from server
}

/**
 * ExpeditionTable Component
 * Displays a list of expeditions with filtering, search, pagination and action capabilities
 */
export default function ExpeditionTable({
  expeditions,
  allWarehouses = [],
  allSellers = [],
  allProviders = [],
  allCountries = [],
  pagination,
  error,
  filters,
  currentUserRole = UserRole.SELLER, // Default to seller
}: ExpeditionTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
 

  // State for search and filters
  const [search, setSearch] = useState(filters.search || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(
    filters.status || ALL_STATUSES
  );
  const [transportModeFilter, setTransportModeFilter] = useState(
    filters.transportMode || ALL_TRANSPORT_MODES
  );
  const [providerTypeFilter, setProviderTypeFilter] = useState(
    filters.providerType || ALL_PROVIDER_TYPES
  );
  const [warehouseFilter, setWarehouseFilter] = useState(
    filters.warehouseId || ALL_WAREHOUSES
  );
  const [sellerFilter, setSellerFilter] = useState(
    filters.sellerId || ALL_SELLERS
  );
  const [countryFilter, setCountryFilter] = useState(
    filters.fromCountry || ALL_COUNTRIES
  );
  const [weightLevelFilter, setWeightLevelFilter] = useState(
    filters.weightLevel || ALL_WEIGHT_LEVELS
  );
  const [dateFromFilter, setDateFromFilter] = useState(
    filters.dateFrom || ""
  );
  const [dateToFilter, setDateToFilter] = useState(
    filters.dateTo || ""
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(filters.limit || 10);

 

  // Check if user is admin or moderator
  const isAdminOrModerator =
    currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MODERATOR;

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters({
      search: search || undefined,
      status:
        statusFilter !== ALL_STATUSES
          ? (statusFilter as ExpeditionStatus)
          : undefined,
      transportMode:
        transportModeFilter !== ALL_TRANSPORT_MODES
          ? (transportModeFilter as TransportMode)
          : undefined,
      providerType:
        providerTypeFilter !== ALL_PROVIDER_TYPES
          ? (providerTypeFilter as ProviderType)
          : undefined,
      warehouseId:
        warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      sellerId:
        isAdminOrModerator && sellerFilter !== ALL_SELLERS
          ? sellerFilter
          : undefined,
      fromCountry:
        countryFilter !== ALL_COUNTRIES ? countryFilter : undefined,
      weightLevel:
        weightLevelFilter !== ALL_WEIGHT_LEVELS ? weightLevelFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      page: 1, // Reset to first page on new search
      limit: itemsPerPage,
    });
  };

  // Apply filters
  const applyFilters = () => {
    navigateWithFilters({
      search: search || undefined,
      status:
        statusFilter !== ALL_STATUSES
          ? (statusFilter as ExpeditionStatus)
          : undefined,
      transportMode:
        transportModeFilter !== ALL_TRANSPORT_MODES
          ? (transportModeFilter as TransportMode)
          : undefined,
      providerType:
        providerTypeFilter !== ALL_PROVIDER_TYPES
          ? (providerTypeFilter as ProviderType)
          : undefined,
      warehouseId:
        warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      sellerId:
        isAdminOrModerator && sellerFilter !== ALL_SELLERS
          ? sellerFilter
          : undefined,
      fromCountry:
        countryFilter !== ALL_COUNTRIES ? countryFilter : undefined,
      weightLevel:
        weightLevelFilter !== ALL_WEIGHT_LEVELS ? weightLevelFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      page: 1, // Reset to first page on filter change
      limit: itemsPerPage,
    });
    setIsFiltersOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setStatusFilter(ALL_STATUSES);
    setTransportModeFilter(ALL_TRANSPORT_MODES);
    setProviderTypeFilter(ALL_PROVIDER_TYPES);
    setWarehouseFilter(ALL_WAREHOUSES);
    setSellerFilter(ALL_SELLERS);
    setCountryFilter(ALL_COUNTRIES);
    setWeightLevelFilter(ALL_WEIGHT_LEVELS);
    setDateFromFilter("");
    setDateToFilter("");
    navigateWithFilters({
      page: 1,
      limit: itemsPerPage,
    });
    setIsFiltersOpen(false);
  };

  // Change page
  const handlePageChange = (page: number) => {
    navigateWithFilters({
      ...filters,
      page,
    });
  };

  // Change items per page
  const handleItemsPerPageChange = (value: string) => {
    const limit = parseInt(value);
    setItemsPerPage(limit);
    navigateWithFilters({
      ...filters,
      page: 1, // Reset to first page when changing limit
      limit,
    });
  };

  // Helper function to navigate with filters
  const navigateWithFilters = (newFilters: any) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.append("search", newFilters.search);
    if (newFilters.status) params.append("status", newFilters.status);
    if (newFilters.transportMode) params.append("transportMode", newFilters.transportMode);
    if (newFilters.providerType) params.append("providerType", newFilters.providerType);
    if (newFilters.warehouseId) params.append("warehouseId", newFilters.warehouseId);
    if (newFilters.sellerId) params.append("sellerId", newFilters.sellerId);
    if (newFilters.fromCountry) params.append("fromCountry", newFilters.fromCountry);
    if (newFilters.weightLevel) params.append("weightLevel", newFilters.weightLevel);
    if (newFilters.dateFrom) params.append("dateFrom", newFilters.dateFrom);
    if (newFilters.dateTo) params.append("dateTo", newFilters.dateTo);
    if (newFilters.page) params.append("page", newFilters.page.toString());
    if (newFilters.limit) params.append("limit", newFilters.limit.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle status update
  const handleStatusUpdate = async (id: string, status: ExpeditionStatus, rejectedReason?: string) => {
    startTransition(async () => {
      const result = await updateExpeditionStatus(id, status, rejectedReason);

      if (result.success) {
        toast(t("expeditions.expeditionUpdated"));
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update status");
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
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      if (i <= 1 || i >= totalPages) continue; // Skip first and last page as they're handled separately

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
  const getStatusBadge = (status: ExpeditionStatus) => {
    const statusConfig = {
      [ExpeditionStatus.PENDING]: {
        label: t("expeditions.statuses.pending"),
        className: "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200",
        icon: <Clock className="h-3 w-3" />,
      },
      [ExpeditionStatus.APPROVED]: {
        label: t("expeditions.statuses.approved"),
        className: "bg-green-50 text-green-700 hover:bg-green-50 border-green-200",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      [ExpeditionStatus.IN_TRANSIT]: {
        label: t("expeditions.statuses.in_transit"),
        className: "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200",
        icon: <Truck className="h-3 w-3" />,
      },
      [ExpeditionStatus.DELIVERED]: {
        label: t("expeditions.statuses.delivered"),
        className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      [ExpeditionStatus.CANCELLED]: {
        label: t("expeditions.statuses.cancelled"),
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
        icon: <XCircle className="h-3 w-3" />,
      },
      [ExpeditionStatus.REJECTED]: {
        label: t("expeditions.statuses.rejected"),
        className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200",
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    return (
      statusConfig[status] || {
        label: "Unknown",
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
        icon: <AlertCircle className="h-3 w-3" />,
      }
    );
  };

  // Get transport mode icon and label
  const getTransportMode = (mode: TransportMode) => {
    const modeConfig = {
      [TransportMode.ROAD]: {
        label: t("expeditions.transportModes.road"),
        icon: <Truck className="h-4 w-4" />,
      },
      [TransportMode.RAILWAY]: {
        label: t("expeditions.transportModes.railway"),
        icon: <Truck className="h-4 w-4" />,
      },
      [TransportMode.AIR]: {
        label: t("expeditions.transportModes.air"),
        icon: <Package className="h-4 w-4" />,
      },
      [TransportMode.MARITIME]: {
        label: t("expeditions.transportModes.maritime"),
        icon: <Package className="h-4 w-4" />,
      },
    };

    return modeConfig[mode] || { label: mode, icon: <Package className="h-4 w-4" /> };
  };

  // Get provider type label
  const getProviderType = (type: ProviderType) => {
    const typeConfig = {
      [ProviderType.OWN]: t("expeditions.providerTypes.own"),
      [ProviderType.REGISTERED]: t("expeditions.providerTypes.registered"),
    };

    return typeConfig[type] || type;
  };

  // Format weight
  const formatWeight = (weight: number) => {
    return `${weight} KG`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  // Format currency
  const formatCurrency = async (value?: number,warehouseCurrency?: string) => {
    console.log("🚀 ~ formatCurrency ~ warehouseCurrency:", warehouseCurrency)
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: warehouseCurrency,
    }).format(value);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("expeditions.title")}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("expeditions.searchExpeditions")}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="default">
            {t("expeditions.applyFilters")}
          </Button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-4 overflow-y-auto">
              <SheetHeader className="px-1">
                <SheetTitle className="text-xl">Filters</SheetTitle>
                <SheetDescription className="text-sm">
                  {t("expeditions.applyFilters")}
                </SheetDescription>
              </SheetHeader>

              <div className="py-8 space-y-6">
                {/* Status Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("expeditions.filterByStatus")}
                  </h3>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
                      {Object.values(ExpeditionStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusBadge(status).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transport Mode Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("expeditions.filterByTransportMode")}
                  </h3>
                  <Select value={transportModeFilter} onValueChange={setTransportModeFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Transport Modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_TRANSPORT_MODES}>All Transport Modes</SelectItem>
                      {Object.values(TransportMode).map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {getTransportMode(mode).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provider Type Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("expeditions.filterByProviderType")}
                  </h3>
                  <Select value={providerTypeFilter} onValueChange={setProviderTypeFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Provider Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_PROVIDER_TYPES}>All Provider Types</SelectItem>
                      {Object.values(ProviderType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getProviderType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Warehouse Filter */}
                {allWarehouses.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium leading-tight">
                      {t("expeditions.filterByWarehouse")}
                    </h3>
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Warehouses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_WAREHOUSES}>All Warehouses</SelectItem>
                        {allWarehouses.map((warehouse) => (
                          <SelectItem key={warehouse._id} value={warehouse._id}>
                            {warehouse.name} ({warehouse.country})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Seller Filter (Admin/Moderator only) */}
                {isAdminOrModerator && allSellers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium leading-tight">
                      {t("expeditions.filterBySeller")}
                    </h3>
                    <Select value={sellerFilter} onValueChange={setSellerFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Sellers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_SELLERS}>All Sellers</SelectItem>
                        {allSellers.map((seller) => (
                          <SelectItem key={seller._id} value={seller._id}>
                            {seller.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Country Filter */}
                {allCountries.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium leading-tight">
                      {t("expeditions.filterByCountry")}
                    </h3>
                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Countries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_COUNTRIES}>All Countries</SelectItem>
                        {allCountries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Weight Level Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("expeditions.filterByWeight")}
                  </h3>
                  <Select value={weightLevelFilter} onValueChange={setWeightLevelFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Weight Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_WEIGHT_LEVELS}>
                        {t("expeditions.weightLevels.all")}
                      </SelectItem>
                      <SelectItem value="light">
                        {t("expeditions.weightLevels.light")}
                      </SelectItem>
                      <SelectItem value="medium">
                        {t("expeditions.weightLevels.medium")}
                      </SelectItem>
                      <SelectItem value="heavy">
                        {t("expeditions.weightLevels.heavy")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filters */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("expeditions.filterByDate")}
                  </h3>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      placeholder="From Date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="To Date"
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button onClick={applyFilters}>
                      {t("expeditions.applyFilters")}
                    </Button>
                  </SheetClose>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    {t("expeditions.clearFilters")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard/seller/expeditions/create" passHref>
            <Button className="flex gap-2">
              <PlusCircle className="h-4 w-4" />
              {t("expeditions.addExpedition")}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("expeditions.title")}</CardTitle>
          <CardDescription>
            {pagination?.total
              ? `${pagination.total} ${
                  pagination.total === 1 ? "expedition" : "expeditions"
                } found`
              : t("expeditions.noExpeditionsFound")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expeditions.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">{t("expeditions.expeditionCode")}</TableHead>
                    {isAdminOrModerator && (
                      <TableHead className="min-w-[100px]">
                        {t("common.seller")}
                      </TableHead>
                    )}
                    <TableHead className="min-w-[120px]">
                      {t("expeditions.fromCountry")}
                    </TableHead>
                    <TableHead className="min-w-[80px]">
                      {t("common.weight")}
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      {t("expeditions.expeditionDate")}
                    </TableHead>
                    <TableHead className="min-w-[140px]">
                      {t("expeditions.transportMode.title")}
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      {t("expeditions.warehouseName")}
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      {t("expeditions.totalProducts")}
                    </TableHead>
                    <TableHead className="min-w-[100px]">{t("common.status")}</TableHead>
                    <TableHead className="text-right min-w-[80px]">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expeditions.map((expedition) => (
                    <TableRow key={expedition._id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                            {expedition.expeditionCode}
                          </code>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {getTransportMode(expedition.transportMode).icon}
                            <span>{getProviderType(expedition.providerType as any)}</span>
                          </div>
                        </div>
                      </TableCell>
                      {isAdminOrModerator && (
                        <TableCell>
                          {expedition.sellerName || "-"}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {expedition.fromCountry}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Weight className="h-3 w-3 text-muted-foreground" />
                          {formatWeight(expedition.weight)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(expedition.expeditionDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTransportMode(expedition.transportMode).icon}
                          {getTransportMode(expedition.transportMode).label}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expedition.warehouseName || "-"}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Package className="h-3 w-3 text-muted-foreground" />
                                <span>{expedition.totalProducts}</span>
                                <span className="text-muted-foreground">
                                  ({expedition.totalQuantity})
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <p>{expedition.totalProducts} Products</p>
                                <p>{expedition.totalQuantity} Total Quantity</p>
                                {expedition.totalValue && (
                                  <p>{formatCurrency(expedition.totalValue,expedition.warehouse?.currency)} Total Value</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusBadge(expedition.status).className} flex items-center gap-1`}
                        >
                          {getStatusBadge(expedition.status).icon}
                          {getStatusBadge(expedition.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {t("common.actions")}
                            </DropdownMenuLabel>
                            <DropdownMenuItem className="cursor-pointer" asChild>
                              <Link href={`/dashboard/seller/expeditions/${expedition._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.view")}
                              </Link>
                            </DropdownMenuItem>
                            
                            {/* Status Actions for Admin/Moderator */}
                            {isAdminOrModerator && (
                              <>
                                <DropdownMenuSeparator />
                                {expedition.status === ExpeditionStatus.PENDING && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          expedition._id,
                                          ExpeditionStatus.APPROVED
                                        )
                                      }
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          expedition._id,
                                          ExpeditionStatus.REJECTED,
                                          "Rejected by admin"
                                        )
                                      }
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {expedition.status === ExpeditionStatus.APPROVED && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        expedition._id,
                                        ExpeditionStatus.IN_TRANSIT
                                      )
                                    }
                                    className="text-blue-600"
                                  >
                                    <Truck className="mr-2 h-4 w-4" />
                                    Mark In Transit
                                  </DropdownMenuItem>
                                )}
                                {expedition.status === ExpeditionStatus.IN_TRANSIT && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        expedition._id,
                                        ExpeditionStatus.DELIVERED
                                      )
                                    }
                                    className="text-emerald-600"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark Delivered
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}

                            {/* Edit and Delete for Sellers (only pending expeditions) */}
                            {currentUserRole === UserRole.SELLER && expedition.status === ExpeditionStatus.PENDING && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/seller/expeditions/${expedition._id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t("common.edit")}
                                  </Link>
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {t("common.delete")}
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {t("expeditions.deleteDialog.title")}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t("expeditions.deleteDialog.description")}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        {t("expeditions.deleteDialog.cancelButton")}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          // TODO: Implement delete functionality
                                          toast("Delete functionality not implemented yet");
                                        }}
                                        disabled={isPending}
                                        className="bg-red-600 text-white hover:bg-red-700"
                                      >
                                        {t("expeditions.deleteDialog.confirmButton")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
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
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground text-center">
                {t("expeditions.noExpeditionsFound")}
              </p>
              <Link href="/dashboard/seller/expeditions/create" passHref>
                <Button variant="outline">{t("expeditions.addExpedition")}</Button>
              </Link>
            </div>
          )}
        </CardContent>
        {pagination && pagination.totalPages > 0 && (
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("warehouse.pagination.itemsPerPage")}
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
              <PaginationContent>{renderPaginationItems()}</PaginationContent>
            </Pagination>

            <div className="text-sm text-muted-foreground">
              {t("warehouse.pagination.showing")}{" "}
              {pagination.total === 0
                ? 0
                : (pagination.page - 1) * pagination.limit + 1}
              -{Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              {t("warehouse.pagination.of")} {pagination.total}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  PlusCircle,
  Search,
  FilterX,
  Filter,
  Users,
  UserCheck,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Warehouse,
  WarehouseFilterParams,
  PaginationInfo,
} from "@/types/warehouse";
import WarehouseActions from "./warehouse-action";
import {
  deleteWarehouse,
  toggleWarehouseStatus,
} from "@/app/actions/warehouse";

// Constants for filter values
const ALL_COUNTRIES = "all_countries";
const ALL_STATUSES = "all";
const ACTIVE_STATUS = "active";
const INACTIVE_STATUS = "inactive";
const ALL_AVAILABILITY = "all";
const AVAILABLE_TO_ALL = "available_to_all";
const ASSIGNED_SELLERS = "assigned_sellers";

interface WarehouseListProps {
  warehouses: Warehouse[];
  allCountries?: string[];
  pagination?: PaginationInfo;
  error?: string;
  filters: WarehouseFilterParams;
}

/**
 * WarehouseList Component
 * Displays a list of warehouses with filtering, search, pagination and action capabilities
 */
export default function WarehouseList({
  warehouses,
  allCountries = [],
  pagination,
  error,
  filters,
}: WarehouseListProps) {
  console.log("🚀 ~ warehouses:", warehouses)
  const t = useTranslations("warehouse");
  const router = useRouter();
  const pathname = usePathname();

  // State for search and filters
  const [search, setSearch] = useState(filters.search || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState(
    filters.country || ALL_COUNTRIES
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    filters.isActive === true
      ? ACTIVE_STATUS
      : filters.isActive === false
      ? INACTIVE_STATUS
      : ALL_STATUSES
  );
  const [availabilityFilter, setAvailabilityFilter] = useState<string>(
    filters.isAvailableToAll === true
      ? AVAILABLE_TO_ALL
      : filters.isAvailableToAll === false
      ? ASSIGNED_SELLERS
      : ALL_AVAILABILITY
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(filters.limit || 10);

  // Use countries provided from the database, or fallback to extracting from current warehouses
  const countries =
    allCountries.length > 0
      ? allCountries
      : Array.from(
          new Set(warehouses.map((warehouse) => warehouse.country))
        ).sort();

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters({
      search: search || undefined,
      country: countryFilter !== ALL_COUNTRIES ? countryFilter : undefined,
      isActive:
        statusFilter === ACTIVE_STATUS
          ? true
          : statusFilter === INACTIVE_STATUS
          ? false
          : undefined,
      isAvailableToAll:
        availabilityFilter === AVAILABLE_TO_ALL
          ? true
          : availabilityFilter === ASSIGNED_SELLERS
          ? false
          : undefined,
      page: 1, // Reset to first page on new search
      limit: itemsPerPage,
    });
  };

  // Apply filters
  const applyFilters = () => {
    navigateWithFilters({
      search: search || undefined,
      country: countryFilter !== ALL_COUNTRIES ? countryFilter : undefined,
      isActive:
        statusFilter === ACTIVE_STATUS
          ? true
          : statusFilter === INACTIVE_STATUS
          ? false
          : undefined,
      isAvailableToAll:
        availabilityFilter === AVAILABLE_TO_ALL
          ? true
          : availabilityFilter === ASSIGNED_SELLERS
          ? false
          : undefined,
      page: 1, // Reset to first page on filter change
      limit: itemsPerPage,
    });
    setIsFiltersOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setCountryFilter(ALL_COUNTRIES);
    setStatusFilter(ALL_STATUSES);
    setAvailabilityFilter(ALL_AVAILABILITY);
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
  const navigateWithFilters = (newFilters: WarehouseFilterParams) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.append("search", newFilters.search);
    if (newFilters.country) params.append("country", newFilters.country);
    if (newFilters.isActive !== undefined)
      params.append("isActive", newFilters.isActive.toString());
    if (newFilters.isAvailableToAll !== undefined)
      params.append("isAvailableToAll", newFilters.isAvailableToAll.toString());
    if (newFilters.page) params.append("page", newFilters.page.toString());
    if (newFilters.limit) params.append("limit", newFilters.limit.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle warehouse deletion
  const handleDelete = async (id: string) => {
    const result = await deleteWarehouse(id);

    if (result.success) {
      toast(t("messages.deleteSuccess"));

      // If we're on the last page and delete the last item, go to previous page
      if (
        pagination &&
        pagination.page > 1 &&
        warehouses.length === 1 &&
        pagination.page === pagination.totalPages
      ) {
        handlePageChange(pagination.page - 1);
      } else {
        // Otherwise just refresh the current page
        router.refresh();
      }
    } else if (result.error) {
      toast(t("messages.error"));
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (id: string) => {
    const result = await toggleWarehouseStatus(id);

    if (result.warehouse) {
      toast(t("messages.statusToggleSuccess"));
      router.refresh();
    } else if (result.error) {
      toast(t("messages.error"));
    }
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
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
              placeholder={t("search")}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="default">
            {t("filters.apply")}
          </Button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                {t("filters.title")}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-4">
              <SheetHeader className="px-1">
                <SheetTitle className="text-xl">
                  {t("filters.title")}
                </SheetTitle>
                <SheetDescription className="text-sm">
                  {t("filters.apply")}
                </SheetDescription>
              </SheetHeader>

              <div className="py-8 space-y-8">
                {/* Country Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("filters.country")}
                  </h3>
                  {countries.length <= 10 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          type="button"
                          variant={
                            countryFilter === ALL_COUNTRIES
                              ? "default"
                              : "outline"
                          }
                          className="justify-start"
                          onClick={() => setCountryFilter(ALL_COUNTRIES)}
                        >
                          {t("filters.all")}
                        </Button>
                        {countries.map((country) => (
                          <Button
                            key={country}
                            type="button"
                            variant={
                              countryFilter === country ? "default" : "outline"
                            }
                            className="justify-start"
                            onClick={() => setCountryFilter(country)}
                          >
                            {country}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Select
                      value={countryFilter}
                      onValueChange={setCountryFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("filters.all")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_COUNTRIES}>
                          {t("filters.all")}
                        </SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("filters.status")}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      type="button"
                      variant={
                        statusFilter === ALL_STATUSES ? "default" : "outline"
                      }
                      className="justify-start"
                      onClick={() => setStatusFilter(ALL_STATUSES)}
                    >
                      {t("filters.all")}
                    </Button>
                    <Button
                      type="button"
                      variant={
                        statusFilter === ACTIVE_STATUS ? "default" : "outline"
                      }
                      className="justify-start"
                      onClick={() => setStatusFilter(ACTIVE_STATUS)}
                    >
                      {t("filters.active")}
                    </Button>
                    <Button
                      type="button"
                      variant={
                        statusFilter === INACTIVE_STATUS ? "default" : "outline"
                      }
                      className="justify-start"
                      onClick={() => setStatusFilter(INACTIVE_STATUS)}
                    >
                      {t("filters.inactive")}
                    </Button>
                  </div>
                </div>

                {/* Availability Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("filters.availability")}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      type="button"
                      variant={
                        availabilityFilter === ALL_AVAILABILITY
                          ? "default"
                          : "outline"
                      }
                      className="justify-start"
                      onClick={() => setAvailabilityFilter(ALL_AVAILABILITY)}
                    >
                      {t("filters.all")}
                    </Button>
                    <Button
                      type="button"
                      variant={
                        availabilityFilter === AVAILABLE_TO_ALL
                          ? "default"
                          : "outline"
                      }
                      className="justify-start"
                      onClick={() => setAvailabilityFilter(AVAILABLE_TO_ALL)}
                    >
                      {t("filters.availableToAll")}
                    </Button>
                    <Button
                      type="button"
                      variant={
                        availabilityFilter === ASSIGNED_SELLERS
                          ? "default"
                          : "outline"
                      }
                      className="justify-start"
                      onClick={() => setAvailabilityFilter(ASSIGNED_SELLERS)}
                    >
                      {t("filters.assignedSellers")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button onClick={applyFilters}>{t("filters.apply")}</Button>
                  </SheetClose>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    {t("filters.clear")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard/admin/warehouse/create" passHref>
            <Button className="flex gap-2">
              <PlusCircle className="h-4 w-4" />
              {t("createWarehouse")}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {pagination?.total
              ? `${pagination.total} ${
                  pagination.total === 1 ? "warehouse" : "warehouses"
                } found`
              : t("noWarehouses")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {warehouses.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead>{t("table.country")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("table.city")}
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("table.currency")}
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      {t("table.capacity")}
                    </TableHead>
                    <TableHead>{t("table.availability")}</TableHead>
                    <TableHead className="hidden xl:table-cell">
                      {t("table.conversionEnabled")}
                    </TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">
                      {t("table.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse._id}>
                      <TableCell className="font-medium">
                        {warehouse.name}
                      </TableCell>
                      <TableCell>{warehouse.country}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {warehouse.city || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {warehouse.currency}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {warehouse.capacity
                          ? `${warehouse.capacity} ${
                              warehouse.capacityUnit || "items"
                            }`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {warehouse.isAvailableToAll ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {t("table.allSellers")}
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200 mb-1"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              {warehouse.assignedSellers?.length || 0}{" "}
                              {t("table.sellers")}
                            </Badge>
                            {warehouse.sellerDetails &&
                              warehouse.sellerDetails.length > 0 && (
                                <div className="space-y-1">
                                  {warehouse.sellerDetails
                                    .slice(0, 3)
                                    .map((seller) => (
                                      <div
                                        key={seller._id}
                                        className="text-xs text-muted-foreground"
                                      >
                                        {seller.name}
                                        {seller.businessName && (
                                          <span className="text-gray-400">
                                            {" "}
                                            • {seller.businessName}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  {warehouse.sellerDetails.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{warehouse.sellerDetails.length - 3}{" "}
                                      {t("table.more")}
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {warehouse.currencyConversion.enabled ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
                          >
                            {warehouse.currency} →{" "}
                            {warehouse.currencyConversion.targetCurrency}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-600 hover:bg-gray-50 border-gray-200"
                          >
                            {t("details.disabled")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {warehouse.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
                          >
                            {t("filters.active")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200"
                          >
                            {t("filters.inactive")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <WarehouseActions
                          warehouse={warehouse}
                          onDelete={handleDelete}
                          onToggleStatus={handleToggleStatus}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <p className="text-muted-foreground text-center">
                {t("noWarehouses")}
              </p>
              <Link href="/dashboard/admin/warehouse/create" passHref>
                <Button variant="outline">{t("createWarehouse")}</Button>
              </Link>
            </div>
          )}
        </CardContent>
        {pagination && pagination.totalPages > 0 && (
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("pagination.itemsPerPage")}
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
              {t("pagination.showing")}{" "}
              {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              {t("pagination.of")} {pagination.total}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PlusCircle, Search, Filter, Eye, Edit, Trash2, Package } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ProductTableData, ProductFilters } from "@/types/product";
import { ProductStatus } from "@/lib/db/models/product";
import { PaginationData } from "@/types/user";

// Constants for filter values
const ALL_STATUSES = "all_statuses";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";

interface ProductTableProps {
  products: ProductTableData[];
  allWarehouses?: { _id: string; name: string; country: string }[];
  allSellers?: { _id: string; name: string; email: string }[];
  pagination: PaginationData;
  error?: string;
  filters: ProductFilters;
  showSellerFilter?: boolean; // For admin/moderator view
  onProductAction?: (action: 'view' | 'edit' | 'delete', productId: string) => void;
}

export default function ProductTable({
  products,
  allWarehouses = [],
  allSellers = [],
  pagination,
  error,
  filters,
  showSellerFilter = false,
  onProductAction,
}: ProductTableProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  // State for search and filters
  const [search, setSearch] = useState(filters.search || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(filters.status || ALL_STATUSES);
  const [warehouseFilter, setWarehouseFilter] = useState(filters.warehouseId || ALL_WAREHOUSES);
  const [sellerFilter, setSellerFilter] = useState(filters.sellerId || ALL_SELLERS);
  const [minStock, setMinStock] = useState(filters.minStock?.toString() || "");
  const [maxStock, setMaxStock] = useState(filters.maxStock?.toString() || "");
  const [itemsPerPage, setItemsPerPage] = useState<number>(filters.limit || 10);

  // Apply filters
  const applyFilters = () => {
    const searchParams = new URLSearchParams();

    if (search) searchParams.set("search", search);
    if (statusFilter && statusFilter !== ALL_STATUSES) searchParams.set("status", statusFilter);
    if (warehouseFilter && warehouseFilter !== ALL_WAREHOUSES) searchParams.set("warehouseId", warehouseFilter);
    if (showSellerFilter && sellerFilter && sellerFilter !== ALL_SELLERS) searchParams.set("sellerId", sellerFilter);
    if (minStock) searchParams.set("minStock", minStock);
    if (maxStock) searchParams.set("maxStock", maxStock);
    if (itemsPerPage !== 10) searchParams.set("limit", itemsPerPage.toString());

    searchParams.set("page", "1"); // Reset to first page
    router.push(`${pathname}?${searchParams.toString()}`);
    setIsFiltersOpen(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setStatusFilter(ALL_STATUSES);
    setWarehouseFilter(ALL_WAREHOUSES);
    setSellerFilter(ALL_SELLERS);
    setMinStock("");
    setMaxStock("");
    router.push(pathname);
    setIsFiltersOpen(false);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", page.toString());
    router.push(`${pathname}?${searchParams.toString()}`);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newLimit: string) => {
    setItemsPerPage(parseInt(newLimit));
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("limit", newLimit);
    searchParams.set("page", "1"); // Reset to first page
    router.push(`${pathname}?${searchParams.toString()}`);
  };

  // Get status badge variant
  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.ACTIVE:
        return <Badge variant="default">{t("statuses.active")}</Badge>;
      case ProductStatus.INACTIVE:
        return <Badge variant="secondary">{t("statuses.inactive")}</Badge>;
      case ProductStatus.OUT_OF_STOCK:
        return <Badge variant="destructive">{t("statuses.out_of_stock")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get stock badge variant based on stock level
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">{stock}</Badge>;
    } else if (stock <= 10) {
      return <Badge variant="secondary">{stock}</Badge>;
    } else {
      return <Badge variant="default">{stock}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("productTable.title")}</CardTitle>
          <CardDescription>
            {t("productTable.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Actions Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-sm">
              <Input
                placeholder={t("searchProducts")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex gap-2">
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {t("productTable.filters")}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{t("productTable.filterTitle")}</SheetTitle>
                    <SheetDescription>
                      {t("productTable.filterDescription")}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="text-sm font-medium">{t("filterByStatus")}</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("productTable.allStatuses")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL_STATUSES}>{t("productTable.allStatuses")}</SelectItem>
                          <SelectItem value={ProductStatus.ACTIVE}>{t("statuses.active")}</SelectItem>
                          <SelectItem value={ProductStatus.INACTIVE}>{t("statuses.inactive")}</SelectItem>
                          <SelectItem value={ProductStatus.OUT_OF_STOCK}>{t("statuses.out_of_stock")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">{t("filterByWarehouse")}</label>
                      <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("productTable.allWarehouses")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL_WAREHOUSES}>{t("productTable.allWarehouses")}</SelectItem>
                          {allWarehouses.map((warehouse) => (
                            <SelectItem key={warehouse._id} value={warehouse._id}>
                              {warehouse.name} ({warehouse.country})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {showSellerFilter && (
                      <div>
                        <label className="text-sm font-medium">{t("filterBySeller")}</label>
                        <Select value={sellerFilter} onValueChange={setSellerFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("productTable.allSellers")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ALL_SELLERS}>{t("productTable.allSellers")}</SelectItem>
                            {allSellers.map((seller) => (
                              <SelectItem key={seller._id} value={seller._id}>
                                {seller.name} ({seller.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">{t("productTable.minStock")}</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={minStock}
                          onChange={(e) => setMinStock(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("productTable.maxStock")}</label>
                        <Input
                          type="number"
                          placeholder="1000"
                          value={maxStock}
                          onChange={(e) => setMaxStock(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={applyFilters} className="flex-1">
                        {t("applyFilters")}
                      </Button>
                      <Button onClick={clearFilters} variant="outline" className="flex-1">
                        {t("productTable.clear")}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Products Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("productTable.columns.product")}</TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap">{t("productTable.columns.code")}</TableHead>
                  {showSellerFilter && <TableHead>{t("productTable.seller")}</TableHead>}
                  <TableHead>{t("productTable.columns.warehouse")}</TableHead>
                  <TableHead>{t("table.totalStock")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("productTable.columns.available")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("table.defectiveQuantity")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("table.confirmed")}</TableHead>
                  <TableHead className="hidden xl:table-cell">{t("table.inTransit")}</TableHead>
                  <TableHead className="hidden xl:table-cell">{t("table.delivered")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("created")}</TableHead>
                  <TableHead className="text-right">{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showSellerFilter ? 13 : 12} className="text-center py-8">
                      {t("noProductsFound")}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            {product.image ? (
                              <img
                                src={product.image.url}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <div className="font-medium truncate" title={product.name}>
                              {product.name}
                            </div>
                            <div className="text-sm text-muted-foreground truncate" title={product.description}>
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <div className="font-mono text-sm">{product.code}</div>
                          {product.variantCode && (
                            <div className="font-mono text-xs text-muted-foreground">
                              {product.variantCode}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {showSellerFilter && (
                        <TableCell>
                          <div className="font-medium">{product.sellerName}</div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="text-sm">
                          {product.primaryWarehouseName || 'No Warehouse'}
                          {product.warehouses.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              +{product.warehouses.length - 1} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStockBadge(product.totalStock)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span
                          className={`${
                            (product.availableStock || 0) === 0
                              ? "text-red-600"
                              : (product.availableStock || 0) < 10
                              ? "text-amber-600"
                              : "text-green-600"
                          }`}
                        >
                          {product.availableStock ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className={`${
                          (product.totalDefectiveQuantity || 0) > 0
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}>
                          {product.totalDefectiveQuantity || 0}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className={`${
                          (product.totalConfirmed || 0) > 0
                            ? "text-orange-600"
                            : "text-muted-foreground"
                        }`}>
                          {product.totalConfirmed || 0}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className={`${
                          (product.totalInTransit || 0) > 0
                            ? "text-blue-600"
                            : "text-muted-foreground"
                        }`}>
                          {product.totalInTransit || 0}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className={`${
                          (product.totalDelivered || 0) > 0
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}>
                          {product.totalDelivered || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onProductAction?.('view', product._id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {tc("view")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onProductAction?.('edit', product._id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {tc("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onProductAction?.('delete', product._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {tc("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("productTable.itemsPerPage")}</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>
                {t("productTable.showing", {
                  from: (pagination.page - 1) * pagination.limit + 1,
                  to: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total,
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                {t("productTable.previous")}
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNumber = pagination.totalPages - 4 + i;
                  } else {
                    pageNumber = pagination.page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={pagination.page === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                {t("productTable.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
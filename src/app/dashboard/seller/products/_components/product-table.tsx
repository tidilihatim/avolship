"use client";

// src/app/[locale]/dashboard/products/_components/product-table.tsx
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
  ImageIcon,
  Tag,
  ShoppingBag,
  AlertTriangle,
  History,
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

import { ProductStatus } from "@/lib/db/models/product";
import { ProductTableData, ProductFilters } from "@/types/product";
import { deleteProduct, updateProductStatus } from "@/app/actions/product";
import { UserRole } from "@/lib/db/models/user";
import { getLoginUserRole } from "@/app/actions/auth";
import { PaginationData } from "@/types/user";

// Constants for filter values
const ALL_STATUSES = "all_statuses";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";
const ALL_STOCK_LEVELS = "all_stock_levels";

interface WarehouseOption {
  _id: string;
  name: string;
  country: string;
}

interface SellerOption {
  _id: string;
  name: string;
  email: string;
}

interface ProductListProps {
  products: ProductTableData[];
  allWarehouses?: WarehouseOption[];
  allSellers?: SellerOption[];
  pagination?: PaginationData;
  error?: string;
  filters: ProductFilters & { stockLevel?: string };
}

/**
 * ProductList Component
 * Displays a list of products with filtering, search, pagination and action capabilities
 */
export default function ProductTable({
  products,
  allWarehouses = [],
  allSellers = [],
  pagination,
  error,
  filters,
}: ProductListProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [userRole, setUserRole] = useState<string | null>(null);

  // State for search and filters
  const [search, setSearch] = useState(filters.search || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(
    filters.status || ALL_STATUSES
  );
  const [warehouseFilter, setWarehouseFilter] = useState(
    filters.warehouseId || ALL_WAREHOUSES
  );
  const [sellerFilter, setSellerFilter] = useState(
    filters.sellerId || ALL_SELLERS
  );
  const [stockLevelFilter, setStockLevelFilter] = useState(
    filters.stockLevel || ALL_STOCK_LEVELS
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(filters.limit || 10);

  // Fetch current user role on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await getLoginUserRole();
        setUserRole(role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  // Check if user is admin or moderator (allowed to see seller filter)
  const isAdminOrModerator =
    userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters({
      search: search || undefined,
      status:
        statusFilter !== ALL_STATUSES
          ? (statusFilter as ProductStatus)
          : undefined,
      warehouseId:
        warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      sellerId:
        isAdminOrModerator && sellerFilter !== ALL_SELLERS
          ? sellerFilter
          : undefined,
      stockLevel:
        stockLevelFilter !== ALL_STOCK_LEVELS ? stockLevelFilter : undefined,
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
          ? (statusFilter as ProductStatus)
          : undefined,
      warehouseId:
        warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      sellerId:
        isAdminOrModerator && sellerFilter !== ALL_SELLERS
          ? sellerFilter
          : undefined,
      stockLevel:
        stockLevelFilter !== ALL_STOCK_LEVELS ? stockLevelFilter : undefined,
      page: 1, // Reset to first page on filter change
      limit: itemsPerPage,
    });
    setIsFiltersOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setStatusFilter(ALL_STATUSES);
    setWarehouseFilter(ALL_WAREHOUSES);
    setSellerFilter(ALL_SELLERS);
    setStockLevelFilter(ALL_STOCK_LEVELS);
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
    if (newFilters.warehouseId)
      params.append("warehouseId", newFilters.warehouseId);
    if (newFilters.sellerId) params.append("sellerId", newFilters.sellerId);
    if (newFilters.stockLevel)
      params.append("stockLevel", newFilters.stockLevel);
    if (newFilters.page) params.append("page", newFilters.page.toString());
    if (newFilters.limit) params.append("limit", newFilters.limit.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle product deletion
  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteProduct(id);

      if (result.success) {
        toast(t("products.productDeleted"));

        // If we're on the last page and delete the last item, go to previous page
        if (
          pagination &&
          pagination.page > 1 &&
          products.length === 1 &&
          pagination.page === pagination.totalPages
        ) {
          handlePageChange(pagination.page - 1);
        } else {
          // Otherwise just refresh the current page
          router.refresh();
        }
      } else {
        toast.error(result.message || "Failed to delete product");
      }
    });
  };

  // Handle status toggle
  const handleStatusUpdate = async (id: string, status: ProductStatus) => {
    startTransition(async () => {
      const result = await updateProductStatus(id, status);

      if (result.success) {
        toast(t("products.productUpdated"));
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
  const getStatusBadge = (status: ProductStatus) => {
    const statusConfig = {
      [ProductStatus.ACTIVE]: {
        label: t("products.statuses.active"),
        className:
          "bg-green-50 text-green-700 hover:bg-green-50 border-green-200",
      },
      [ProductStatus.INACTIVE]: {
        label: t("products.statuses.inactive"),
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      },
      [ProductStatus.OUT_OF_STOCK]: {
        label: t("products.statuses.out_of_stock"),
        className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200",
      },
    };

    return (
      statusConfig[status] || {
        label: "Unknown",
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      }
    );
  };

  // Format price with currency
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", // Default to USD, can be customized based on user preference
    }).format(price);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("products.title")}</CardTitle>
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
              placeholder={t("products.searchProducts")}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="default">
            {t("products.applyFilters")}
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
            <SheetContent side="right" className="p-4">
              <SheetHeader className="px-1">
                <SheetTitle className="text-xl">Filters</SheetTitle>
                <SheetDescription className="text-sm">
                  {t("products.applyFilters")}
                </SheetDescription>
              </SheetHeader>

              <div className="py-8 space-y-8">
                {/* Status Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("products.filterByStatus")}
                  </h3>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
                      {Object.values(ProductStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusBadge(status).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Warehouse Filter */}
                {allWarehouses.length > 0 && isAdminOrModerator && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium leading-tight">
                      {t("products.filterByWarehouse")}
                    </h3>
                    <Select
                      value={warehouseFilter}
                      onValueChange={setWarehouseFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Warehouses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_WAREHOUSES}>
                          All Warehouses
                        </SelectItem>
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
                      {t("products.filterBySeller")}
                    </h3>
                    <Select
                      value={sellerFilter}
                      onValueChange={setSellerFilter}
                    >
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

                {/* Stock Level Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("products.filterByStock")}
                  </h3>
                  <Select
                    value={stockLevelFilter}
                    onValueChange={setStockLevelFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Stock Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_STOCK_LEVELS}>
                        {t("products.stockLevels.all")}
                      </SelectItem>
                      <SelectItem value="low">
                        {t("products.stockLevels.low")}
                      </SelectItem>
                      <SelectItem value="medium">
                        {t("products.stockLevels.medium")}
                      </SelectItem>
                      <SelectItem value="high">
                        {t("products.stockLevels.high")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button onClick={applyFilters}>
                      {t("products.applyFilters")}
                    </Button>
                  </SheetClose>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    {t("products.clearFilters")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard/seller/products/create" passHref>
            <Button className="flex gap-2">
              <PlusCircle className="h-4 w-4" />
              {t("products.addProduct")}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("products.title")}</CardTitle>
          <CardDescription>
            {pagination?.total
              ? `${pagination.total} ${
                  pagination.total === 1 ? "product" : "products"
                } found`
              : t("products.noProductsFound")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]"></TableHead>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("common.code")}
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      {t("common.warehouse")}
                    </TableHead>
                    {isAdminOrModerator && (
                      <TableHead className="hidden xl:table-cell">
                        {t("common.seller")}
                      </TableHead>
                    )}
                    <TableHead>{t("common.stock")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("common.status")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        {product.image?.url ? (
                          <div className="h-10 w-10 rounded-md overflow-hidden relative">
                            <img
                              src={product.image.url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[150px] md:max-w-[250px]">
                            {product.name}
                          </span>
                          {product.variantCode && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" /> {product.variantCode}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {product.code}
                        </code>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate max-w-[150px] inline-block cursor-help">
                                {product.primaryWarehouseName || "-"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <p className="font-semibold">
                                  {product.warehouses.length}{" "}
                                  {product.warehouses.length === 1
                                    ? "Warehouse"
                                    : "Warehouses"}
                                </p>
                                {product.warehouses.map((wh) => (
                                  <div
                                    key={wh.warehouseId}
                                    className="flex justify-between gap-4"
                                  >
                                    <span>{wh.warehouseName}</span>
                                    <span className="text-muted-foreground">
                                      {wh.stock} in stock
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      {isAdminOrModerator && (
                        <TableCell className="hidden xl:table-cell">
                          {product.sellerName || "-"}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span
                            className={`${
                              product.totalStock === 0
                                ? "text-red-600"
                                : product.totalStock < 10
                                ? "text-amber-600"
                                : "text-green-600"
                            }`}
                          >
                            {product.totalStock}
                          </span>
                          {product.totalStock < 10 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <AlertTriangle
                                      className={`h-4 w-4 ${
                                        product.totalStock === 0
                                          ? "text-red-600"
                                          : "text-amber-600"
                                      }`}
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {product.totalStock === 0
                                      ? "Out of stock!"
                                      : "Low stock!"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className={getStatusBadge(product.status).className}
                        >
                          {getStatusBadge(product.status).label}
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
                            <DropdownMenuItem
                              className="cursor-pointer"
                              asChild
                            >
                              <Link
                                href={`/dashboard/seller/products/${product._id}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.view")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              asChild
                            >
                              <Link
                                href={`/dashboard/seller/products/stock-history/${product._id}`}
                              >
                                <History className="mr-2 h-4 w-4" />
                                View Stock History
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/seller/products/${product._id}/edit`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t("common.edit")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {/* Status Actions */}
                            {product.status !== ProductStatus.ACTIVE && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(
                                    product._id,
                                    ProductStatus.ACTIVE
                                  )
                                }
                              >
                                Mark as Active
                              </DropdownMenuItem>
                            )}
                            {product.status !== ProductStatus.INACTIVE && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(
                                    product._id,
                                    ProductStatus.INACTIVE
                                  )
                                }
                              >
                                Mark as Inactive
                              </DropdownMenuItem>
                            )}
                            {product.status !== ProductStatus.OUT_OF_STOCK &&
                              product.totalStock === 0 && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(
                                      product._id,
                                      ProductStatus.OUT_OF_STOCK
                                    )
                                  }
                                >
                                  Mark as Out of Stock
                                </DropdownMenuItem>
                              )}

                            <DropdownMenuSeparator />
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
                                    {t("products.deleteDialog.title")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("products.deleteDialog.description")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("products.deleteDialog.cancelButton")}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(product._id)}
                                    disabled={isPending}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    {t("products.deleteDialog.confirmButton")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                <ShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground text-center">
                {t("products.noProductsFound")}
              </p>
              <Link href="/dashboard/seller/products/create" passHref>
                <Button variant="outline">{t("products.addProduct")}</Button>
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

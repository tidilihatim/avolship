// src/app/[locale]/dashboard/products/page.tsx
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductFilters } from "@/types/product";
import { ProductStatus } from "@/lib/db/models/product";
import { getAllWarehouses, getAllSellers, getProducts } from "@/app/actions/product";
import { UserRole } from "@/lib/db/models/user";
import ProductTable from "./_components/product-table";
import { getLoginUserRole } from "@/app/actions/auth";

const ALL_STATUSES = "all_statuses";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";
const ALL_STOCK_LEVELS = "all_stock_levels";

export const metadata: Metadata = {
  title: "Product Management | AvolShip",
  description: "Manage products across multiple warehouses",
};

/**
 * Parse search params using a proper async approach
 */
async function parseSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): Promise<ProductFilters> {
  const filters: ProductFilters = {};

  if (searchParams.search && typeof searchParams.search === "string") {
    filters.search = searchParams.search;
  }

  if (searchParams.status && typeof searchParams.status === "string") {
    if (searchParams.status !== ALL_STATUSES && 
        Object.values(ProductStatus).includes(searchParams.status as ProductStatus)) {
      filters.status = searchParams.status as ProductStatus;
    }
  }

  if (searchParams.warehouseId && typeof searchParams.warehouseId === "string") {
    if (searchParams.warehouseId !== ALL_WAREHOUSES) {
      filters.warehouseId = searchParams.warehouseId;
    }
  }

  if (searchParams.sellerId && typeof searchParams.sellerId === "string") {
    if (searchParams.sellerId !== ALL_SELLERS) {
      filters.sellerId = searchParams.sellerId;
    }
  }

  // Handle stock level filters
  if (searchParams.stockLevel && typeof searchParams.stockLevel === "string") {
    switch (searchParams.stockLevel) {
      case "low":
        filters.maxStock = 10;
        break;
      case "medium":
        filters.minStock = 10;
        filters.maxStock = 50;
        break;
      case "high":
        filters.minStock = 50;
        break;
    }
  }

  // Handle pagination params
  if (searchParams.page && typeof searchParams.page === "string") {
    const page = parseInt(searchParams.page);
    if (!isNaN(page) && page > 0) {
      filters.page = page;
    }
  }

  if (searchParams.limit && typeof searchParams.limit === "string") {
    const limit = parseInt(searchParams.limit);
    if (!isNaN(limit) && limit > 0) {
      filters.limit = limit;
    }
  }

  return filters;
}

/**
 * Product Management Page
 * This page displays the list of products with filtering options and pagination
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParamsPlain = await searchParams
  const t = await getTranslations("products");
  
  // Parse search params for filtering and pagination
  const filters = await parseSearchParams(searchParamsPlain);

  // Set default pagination values if not provided
  if (!filters.page) filters.page = 1;
  if (!filters.limit) filters.limit = 10;

  // Get the current user role
  const userRole = await getLoginUserRole();
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  // Fetch products with filters and pagination
  const { products, pagination, success, message } = await getProducts(
    filters.page,
    filters.limit,
    filters
  );

  // Fetch all available warehouses and sellers for the filters (in parallel)
  // Only fetch sellers if user is admin or moderator
  const warehousesPromise = getAllWarehouses();
  const sellersPromise = isAdminOrModerator ? getAllSellers() : Promise.resolve([]);
  
  const [warehouses, sellers] = await Promise.all([
    warehousesPromise,
    sellersPromise
  ]);

  // For client-side component, we need to pass the original searchParamsPlain values
  const clientFilters: ProductFilters & { stockLevel?: string } = {
    ...filters,
    status: searchParamsPlain.status && typeof searchParamsPlain.status === "string"
      ? (searchParamsPlain.status as ProductStatus)
      : undefined,
    warehouseId: searchParamsPlain.warehouseId && typeof searchParamsPlain.warehouseId === "string"
      ? searchParamsPlain.warehouseId
      : undefined,
    sellerId: isAdminOrModerator && searchParamsPlain.sellerId && typeof searchParamsPlain.sellerId === "string"
      ? searchParamsPlain.sellerId
      : undefined,
    stockLevel: searchParamsPlain.stockLevel && typeof searchParamsPlain.stockLevel === "string"
      ? searchParamsPlain.stockLevel
      : undefined,
  };

  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("manageProducts")}
        </h1>
      </div>

      <ProductTable
        products={products || []}
        allWarehouses={warehouses}
        allSellers={sellers}
        pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
        error={success ? undefined : message}
        filters={clientFilters}
      />
    </div>
  );
}
// src/app/dashboard/moderator/products/page.tsx
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { ProductFilters } from "@/types/product";
import { ProductStatus } from "@/lib/db/models/product";
import { getAllProductsForAdmin, getAllWarehouses, getAllSellers } from "@/app/actions/product";
import { UserRole } from "@/lib/db/models/user";
import { getLoginUserRole } from "@/app/actions/auth";
import ProductTableClient from "@/components/products/product-table-client";

const ALL_STATUSES = "all_statuses";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";

export const metadata: Metadata = {
  title: "Products Management | AvolShip Moderator",
  description: "Manage products across the platform",
};

/**
 * Parse search params for product filtering
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

  if (searchParams.minStock && typeof searchParams.minStock === "string") {
    const minStock = parseInt(searchParams.minStock);
    if (!isNaN(minStock) && minStock >= 0) {
      filters.minStock = minStock;
    }
  }

  if (searchParams.maxStock && typeof searchParams.maxStock === "string") {
    const maxStock = parseInt(searchParams.maxStock);
    if (!isNaN(maxStock) && maxStock >= 0) {
      filters.maxStock = maxStock;
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
 * Moderator Products Management Page
 * This page displays all products across the platform with filtering and pagination
 */
export default async function ModeratorProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParamsPlain = await searchParams;
  const t = await getTranslations("products");

  // Check if user has moderator access
  const userRole = await getLoginUserRole();
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
    redirect('/dashboard');
  }

  // Parse search params for filtering and pagination
  const filters = await parseSearchParams(searchParamsPlain);

  // Set default pagination values if not provided
  if (!filters.page) filters.page = 1;
  if (!filters.limit) filters.limit = 10;

  // Fetch products with filters and pagination (using admin function as moderators have similar access)
  const { products, pagination, success, message } = await getAllProductsForAdmin(
    filters.page,
    filters.limit,
    filters
  );

  // Fetch all available warehouses and sellers for the filters (in parallel)
  const warehousesPromise = getAllWarehouses();
  const sellersPromise = getAllSellers();

  const [warehouses, sellers] = await Promise.all([
    warehousesPromise,
    sellersPromise
  ]);

  // For client-side component, we need to pass the original searchParamsPlain values
  const clientFilters: ProductFilters = {
    ...filters,
    status: searchParamsPlain.status && typeof searchParamsPlain.status === "string"
      ? (searchParamsPlain.status as ProductStatus)
      : undefined,
    warehouseId: searchParamsPlain.warehouseId && typeof searchParamsPlain.warehouseId === "string"
      ? searchParamsPlain.warehouseId
      : undefined,
    sellerId: searchParamsPlain.sellerId && typeof searchParamsPlain.sellerId === "string"
      ? searchParamsPlain.sellerId
      : undefined,
    minStock: searchParamsPlain.minStock && typeof searchParamsPlain.minStock === "string"
      ? parseInt(searchParamsPlain.minStock)
      : undefined,
    maxStock: searchParamsPlain.maxStock && typeof searchParamsPlain.maxStock === "string"
      ? parseInt(searchParamsPlain.maxStock)
      : undefined,
  };

  return (
    <div className="px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Products Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage products across the platform
          </p>
        </div>
      </div>

      <ProductTableClient
        products={products || []}
        allWarehouses={warehouses}
        allSellers={sellers}
        pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
        error={success ? undefined : message}
        filters={clientFilters}
        showSellerFilter={true}
      />
    </div>
  );
}
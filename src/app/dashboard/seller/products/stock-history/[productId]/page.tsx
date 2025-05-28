// src/app/[locale]/dashboard/seller/products/stock-history/[productId]/page.tsx
import { Metadata } from "next";
import { StockHistoryFilters } from "@/types/stock-history";
import { StockMovementType, StockMovementReason } from "@/lib/db/models/stock-history";
import { 
  getStockHistory, 
  getStockSummary, 
  getWarehousesForProduct, 
  getUsersForStockHistory 
} from "@/app/actions/stock-history";
import { UserRole } from "@/lib/db/models/user";
import { notFound } from "next/navigation";
import { getLoginUserRole } from "@/app/actions/auth";
import { getProductById } from "@/app/actions/product";
import StockHistoryTable from "../_components/stock-history-table";

const ALL_MOVEMENT_TYPES = "all_movement_types";
const ALL_REASONS = "all_reasons";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_USERS = "all_users";

export const metadata: Metadata = {
  title: "Stock History | AvolShip",
  description: "Track all stock movements and changes for your products",
};

/**
 * Parse search params for stock history filters
 */
async function parseSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): Promise<StockHistoryFilters> {
  const filters: StockHistoryFilters = {};

  if (searchParams.search && typeof searchParams.search === "string") {
    filters.search = searchParams.search;
  }

  if (searchParams.movementType && typeof searchParams.movementType === "string") {
    if (searchParams.movementType !== ALL_MOVEMENT_TYPES && 
        Object.values(StockMovementType).includes(searchParams.movementType as StockMovementType)) {
      filters.movementType = searchParams.movementType as StockMovementType;
    }
  }

  if (searchParams.reason && typeof searchParams.reason === "string") {
    if (searchParams.reason !== ALL_REASONS && 
        Object.values(StockMovementReason).includes(searchParams.reason as StockMovementReason)) {
      filters.reason = searchParams.reason as StockMovementReason;
    }
  }

  if (searchParams.warehouseId && typeof searchParams.warehouseId === "string") {
    if (searchParams.warehouseId !== ALL_WAREHOUSES) {
      filters.warehouseId = searchParams.warehouseId;
    }
  }

  if (searchParams.userId && typeof searchParams.userId === "string") {
    if (searchParams.userId !== ALL_USERS) {
      filters.userId = searchParams.userId;
    }
  }

  // Handle date filters
  if (searchParams.dateFrom && typeof searchParams.dateFrom === "string") {
    filters.dateFrom = new Date(searchParams.dateFrom);
  }

  if (searchParams.dateTo && typeof searchParams.dateTo === "string") {
    filters.dateTo = new Date(searchParams.dateTo);
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
 * Stock History Page
 * Displays stock movement history for a specific product
 */
export default async function StockHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParamsPlain = await params;
  const resolvedSearchParamsPlain = await searchParams;
  
  // Parse search params for filtering and pagination
  const filters = await parseSearchParams(resolvedSearchParamsPlain);

  // Set default pagination values if not provided
  if (!filters.page) filters.page = 1;
  if (!filters.limit) filters.limit = 10;

  // Get product information
  const {product} = await getProductById(resolvedParamsPlain.productId);
  if (!product) {
    notFound();
  }

  // Get the current user role
  const userRole = await getLoginUserRole();
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  // Fetch stock history with filters and pagination
  const { stockHistory, pagination, success, message } = await getStockHistory(
    resolvedParamsPlain.productId,
    filters.page,
    filters.limit,
    filters
  );

  // Fetch stock summary and related data in parallel
  const summaryPromise = getStockSummary(resolvedParamsPlain.productId);
  const warehousesPromise = getWarehousesForProduct(resolvedParamsPlain.productId);
  const usersPromise = isAdminOrModerator 
    ? getUsersForStockHistory(resolvedParamsPlain.productId) 
    : Promise.resolve([]);
  
  const [summaryResult, warehouses, users] = await Promise.all([
    summaryPromise,
    warehousesPromise,
    usersPromise
  ]);

  // For client-side component, we need to pass the original searchParams values
  const clientFilters: StockHistoryFilters & { 
    movementTypeFilter?: string;
    reasonFilter?: string;
    warehouseFilter?: string;
    userFilter?: string;
  } = {
    ...filters,
    movementTypeFilter: resolvedSearchParamsPlain.movementType && typeof resolvedSearchParamsPlain.movementType === "string"
      ? resolvedSearchParamsPlain.movementType
      : ALL_MOVEMENT_TYPES,
    reasonFilter: resolvedSearchParamsPlain.reason && typeof resolvedSearchParamsPlain.reason === "string"
      ? resolvedSearchParamsPlain.reason
      : ALL_REASONS,
    warehouseFilter: resolvedSearchParamsPlain.warehouseId && typeof resolvedSearchParamsPlain.warehouseId === "string"
      ? resolvedSearchParamsPlain.warehouseId
      : ALL_WAREHOUSES,
    userFilter: isAdminOrModerator && resolvedSearchParamsPlain.userId && typeof resolvedSearchParamsPlain.userId === "string"
      ? resolvedSearchParamsPlain.userId
      : ALL_USERS,
  };

  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <StockHistoryTable
        stockHistory={stockHistory || []}
        allWarehouses={warehouses}
        allUsers={users}
        pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
        summary={summaryResult.success ? summaryResult.summary : undefined}
        error={success ? undefined : message}
        filters={clientFilters}
        productId={resolvedParamsPlain.productId}
        productName={product.name}
      />
    </div>
  );
}
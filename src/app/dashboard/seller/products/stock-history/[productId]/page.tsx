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
import StockMovementSection from "@/components/dashboard/stock-movement-section";

const ALL_MOVEMENT_TYPES = "all_movement_types";
const ALL_REASONS = "all_reasons";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_USERS = "all_users";

// Utility function to safely serialize data for client components
const serializeForClient = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (typeof obj === 'object' && obj._id && typeof obj._id.toString === 'function') {
    // Handle MongoDB ObjectId
    return obj._id.toString();
  }
  
  if (typeof obj === 'object' && obj.toString && obj.toString().match(/^[0-9a-fA-F]{24}$/)) {
    // Handle ObjectId-like objects
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeForClient);
  }
  
  if (typeof obj === 'object') {
    return JSON.parse(JSON.stringify(obj));
  }
  
  return obj;
};

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
      {/* Stock Movement Chart */}
      <StockMovementSection 
        productId={resolvedParamsPlain.productId}
        selectedWarehouseId={filters.warehouseId}
      />
      
      {/* Stock History Table */}
      <StockHistoryTable
        stockHistory={(stockHistory || []).map((item: any) => ({
          _id: item._id?.toString() || '',
          productId: item.productId?.toString() || '',
          productName: item.productName || '',
          productCode: item.productCode || '',
          warehouseId: item.warehouseId?.toString() || '',
          warehouseName: item.warehouseName || '',
          warehouseCountry: item.warehouseCountry || '',
          movementType: item.movementType || '',
          reason: item.reason || '',
          reasonDescription: item.reasonDescription || '',
          quantity: item.quantity || 0,
          previousStock: item.previousStock || 0,
          newStock: item.newStock || 0,
          stockDifference: item.stockDifference || 0,
          orderId: item.orderId?.toString() || undefined,
          orderCode: item.orderCode || undefined,
          transferId: item.transferId?.toString() || undefined,
          userId: item.userId?.toString() || '',
          userName: item.userName || '',
          userRole: item.userRole || '',
          notes: item.notes || '',
          metadata: typeof item.metadata === 'object' && item.metadata !== null 
            ? JSON.parse(JSON.stringify(item.metadata)) 
            : item.metadata,
          createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
          updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
        }))}
        allWarehouses={warehouses.map((w: any) => ({
          _id: w._id?.toString() || '',
          name: w.name || '',
          country: w.country || ''
        }))}
        allUsers={users.map((u: any) => ({
          _id: u._id?.toString() || '',
          name: u.name || '',
          role: u.role || ''
        }))}
        pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
        summary={summaryResult.success && summaryResult.summary ? {
          totalMovements: summaryResult.summary.totalMovements || 0,
          totalIncreases: summaryResult.summary.totalIncreases || 0,
          totalDecreases: summaryResult.summary.totalDecreases || 0,
          currentStock: summaryResult.summary.currentStock || 0,
          lastMovementDate: summaryResult.summary.lastMovementDate || undefined,
          lastRestockDate: summaryResult.summary.lastRestockDate || undefined,
          warehouseBreakdown: (summaryResult.summary.warehouseBreakdown || []).map((wb: any) => ({
            warehouseId: wb.warehouseId?.toString() || '',
            warehouseName: wb.warehouseName || '',
            currentStock: wb.currentStock || 0,
            totalMovements: wb.totalMovements || 0,
            lastMovementDate: wb.lastMovementDate || undefined,
          }))
        } : undefined}
        error={success ? undefined : message}
        filters={{
          search: clientFilters.search,
          movementType: clientFilters.movementType,
          reason: clientFilters.reason,
          warehouseId: clientFilters.warehouseId,
          userId: clientFilters.userId,
          page: clientFilters.page,
          limit: clientFilters.limit,
          dateFrom: clientFilters.dateFrom,
          dateTo: clientFilters.dateTo,
          movementTypeFilter: clientFilters.movementTypeFilter,
          reasonFilter: clientFilters.reasonFilter,
          warehouseFilter: clientFilters.warehouseFilter,
          userFilter: clientFilters.userFilter,
        }}
        productId={resolvedParamsPlain.productId}
        productName={product.name}
      />
    </div>
  );
}
// src/app/[locale]/dashboard/orders/page.tsx
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrderFilters } from "@/types/order";
import { OrderStatus } from "@/lib/db/models/order";
import { getAllWarehouses, getAllSellers, getOrders } from "@/app/actions/order";
import { UserRole } from "@/lib/db/models/user";
import OrderTable from "../../seller/orders/_components/order-table";
import { getLoginUserRole } from "@/app/actions/auth";

const ALL_STATUSES = "all_statuses";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";
const ALL_CALL_STATUSES = "all_call_statuses";

export const metadata: Metadata = {
  title: "Order Management | AvolShip",
  description: "Manage orders across multiple warehouses and sellers",
};

/**
 * Parse search params for order filtering
 */
async function parseSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): Promise<OrderFilters> {
  const filters: OrderFilters = {};

  if (searchParams.search && typeof searchParams.search === "string") {
    filters.search = searchParams.search;
  }

  if (searchParams.status && typeof searchParams.status === "string") {
    if (searchParams.status !== ALL_STATUSES && 
        Object.values(OrderStatus).includes(searchParams.status as OrderStatus)) {
      filters.status = searchParams.status as OrderStatus;
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

  if (searchParams.callStatus && typeof searchParams.callStatus === "string") {
    if (searchParams.callStatus !== ALL_CALL_STATUSES && 
        ['answered', 'unreached', 'busy', 'invalid'].includes(searchParams.callStatus)) {
      filters.callStatus = searchParams.callStatus as 'answered' | 'unreached' | 'busy' | 'invalid';
    }
  }

  if (searchParams.dateFrom && typeof searchParams.dateFrom === "string") {
    filters.dateFrom = searchParams.dateFrom;
  }

  if (searchParams.dateTo && typeof searchParams.dateTo === "string") {
    filters.dateTo = searchParams.dateTo;
  }

  if (searchParams.showDoubleOnly && typeof searchParams.showDoubleOnly === "string") {
    filters.showDoubleOnly = searchParams.showDoubleOnly === "true";
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
 * Orders Management Page
 * This page displays the list of orders with filtering options and pagination
 */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParamsPlain = await searchParams;
  const t = await getTranslations("orders");
  
  // Parse search params for filtering and pagination
  const filters = await parseSearchParams(searchParamsPlain);

  // Set default pagination values if not provided
  if (!filters.page) filters.page = 1;
  if (!filters.limit) filters.limit = 10;

  // Get the current user role
  const userRole = await getLoginUserRole();
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  // Fetch orders with filters and pagination
  const { orders, pagination, success, message } = await getOrders(
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
  const clientFilters: OrderFilters & { dateRange?: string } = {
    ...filters,
    status: searchParamsPlain.status && typeof searchParamsPlain.status === "string"
      ? (searchParamsPlain.status as OrderStatus)
      : undefined,
    warehouseId: searchParamsPlain.warehouseId && typeof searchParamsPlain.warehouseId === "string"
      ? searchParamsPlain.warehouseId
      : undefined,
    sellerId: isAdminOrModerator && searchParamsPlain.sellerId && typeof searchParamsPlain.sellerId === "string"
      ? searchParamsPlain.sellerId
      : undefined,
    callStatus: searchParamsPlain.callStatus && typeof searchParamsPlain.callStatus === "string"
      ? (searchParamsPlain.callStatus as 'answered' | 'unreached' | 'busy' | 'invalid')
      : undefined,
    dateFrom: searchParamsPlain.dateFrom && typeof searchParamsPlain.dateFrom === "string"
      ? searchParamsPlain.dateFrom
      : undefined,
    dateTo: searchParamsPlain.dateTo && typeof searchParamsPlain.dateTo === "string"
      ? searchParamsPlain.dateTo
      : undefined,
    showDoubleOnly: searchParamsPlain.showDoubleOnly && typeof searchParamsPlain.showDoubleOnly === "string"
      ? searchParamsPlain.showDoubleOnly === "true"
      : undefined,
  };

  return (
    <div className="px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("manageOrders")}
        </h1>
      </div>

      <OrderTable
        orders={orders || []}
        allWarehouses={warehouses}
        allSellers={sellers}
        pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
        error={success ? undefined : message}
        filters={clientFilters}
      />
    </div>
  );
}
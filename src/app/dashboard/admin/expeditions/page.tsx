// src/app/[locale]/dashboard/expeditions/page.tsx
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExpeditionFilters } from "@/types/expedition";
import { ExpeditionStatus, TransportMode, ProviderType } from "@/app/dashboard/_constant/expedition";
import { 
  getExpeditions, 
  getAllWarehousesForExpedition, 
  getAllSellersForExpedition,
  getAllProvidersForExpedition,
  getCountriesForExpedition
} from "@/app/actions/expedition";
import { UserRole } from "@/app/dashboard/_constant/user";
import { getServerSession } from "next-auth";
import { authOptions } from '@/config/auth';
import User from "@/lib/db/models/user";
import ExpeditionTable from "../../seller/expeditions/_components/expedition-table";

const ALL_STATUSES = "all_statuses";
const ALL_TRANSPORT_MODES = "all_transport_modes";
const ALL_PROVIDER_TYPES = "all_provider_types";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";
const ALL_COUNTRIES = "all_countries";
const ALL_WEIGHT_LEVELS = "all_weight_levels";

export const metadata: Metadata = {
  title: "Expedition Management | AvolShip",
  description: "Manage expeditions and track shipments",
};

/**
 * Parse search params using a proper async approach
 */
async function parseSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): Promise<ExpeditionFilters> {
  const filters: ExpeditionFilters = {};

  if (searchParams.search && typeof searchParams.search === "string") {
    filters.search = searchParams.search;
  }

  if (searchParams.status && typeof searchParams.status === "string") {
    if (searchParams.status !== ALL_STATUSES && 
        Object.values(ExpeditionStatus).includes(searchParams.status as ExpeditionStatus)) {
      filters.status = searchParams.status as ExpeditionStatus;
    }
  }

  if (searchParams.transportMode && typeof searchParams.transportMode === "string") {
    if (searchParams.transportMode !== ALL_TRANSPORT_MODES && 
        Object.values(TransportMode).includes(searchParams.transportMode as TransportMode)) {
      filters.transportMode = searchParams.transportMode as TransportMode;
    }
  }

  if (searchParams.providerType && typeof searchParams.providerType === "string") {
    if (searchParams.providerType !== ALL_PROVIDER_TYPES && 
        Object.values(ProviderType).includes(searchParams.providerType as ProviderType)) {
      filters.providerType = searchParams.providerType as any;
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

  if (searchParams.fromCountry && typeof searchParams.fromCountry === "string") {
    if (searchParams.fromCountry !== ALL_COUNTRIES) {
      filters.fromCountry = searchParams.fromCountry;
    }
  }

  // Handle weight level filters
  if (searchParams.weightLevel && typeof searchParams.weightLevel === "string") {
    switch (searchParams.weightLevel) {
      case "light":
        filters.weightMax = 5;
        break;
      case "medium":
        filters.weightMin = 5;
        filters.weightMax = 20;
        break;
      case "heavy":
        filters.weightMin = 20;
        break;
    }
  }

  // Handle date range filters
  if (searchParams.dateFrom && typeof searchParams.dateFrom === "string") {
    filters.dateFrom = searchParams.dateFrom;
  }

  if (searchParams.dateTo && typeof searchParams.dateTo === "string") {
    filters.dateTo = searchParams.dateTo;
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
 * Expedition Management Page
 * This page displays the list of expeditions with filtering options and pagination
 */
export default async function ExpeditionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParamsPlain = await searchParams;
  const t = await getTranslations("expeditions");
  
  // Parse search params for filtering and pagination
  const filters = await parseSearchParams(searchParamsPlain);

  // Set default pagination values if not provided
  if (!filters.page) filters.page = 1;
  if (!filters.limit) filters.limit = 10;

  // Get the current user role
  const session = await getServerSession(authOptions);
  let userRole = UserRole.SELLER; // Default role
  
  if (session?.user?.id) {
    const user = await User.findById(session.user.id);
    if (user) {
      userRole = user.role;
    }
  }
  
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  // Fetch expeditions with filters and pagination
  const { expeditions, pagination, success, message } = await getExpeditions(
    filters.page,
    filters.limit,
    filters
  );

  // Fetch all available filter options (in parallel)
  const warehousesPromise = getAllWarehousesForExpedition();
  const sellersPromise = isAdminOrModerator ? getAllSellersForExpedition() : Promise.resolve([]);
  const providersPromise = getAllProvidersForExpedition();
  const countriesPromise = getCountriesForExpedition();
  
  const [warehouses, sellers, providers, countries] = await Promise.all([
    warehousesPromise,
    sellersPromise,
    providersPromise,
    countriesPromise
  ]);

  // For client-side component, we need to pass the original searchParamsPlain values
  const clientFilters: ExpeditionFilters & { 
    weightLevel?: string;
    transportMode?: string;
    providerType?: string;
  } = {
    ...filters,
    status: searchParamsPlain.status && typeof searchParamsPlain.status === "string"
      ? (searchParamsPlain.status as ExpeditionStatus)
      : undefined,
    transportMode: searchParamsPlain.transportMode && typeof searchParamsPlain.transportMode === "string"
      ? searchParamsPlain.transportMode as any
      : undefined,
    providerType: searchParamsPlain.providerType && typeof searchParamsPlain.providerType === "string"
      ? searchParamsPlain.providerType as any
      : undefined,
    warehouseId: searchParamsPlain.warehouseId && typeof searchParamsPlain.warehouseId === "string"
      ? searchParamsPlain.warehouseId
      : undefined,
    sellerId: isAdminOrModerator && searchParamsPlain.sellerId && typeof searchParamsPlain.sellerId === "string"
      ? searchParamsPlain.sellerId
      : undefined,
    fromCountry: searchParamsPlain.fromCountry && typeof searchParamsPlain.fromCountry === "string"
      ? searchParamsPlain.fromCountry
      : undefined,
    weightLevel: searchParamsPlain.weightLevel && typeof searchParamsPlain.weightLevel === "string"
      ? searchParamsPlain.weightLevel
      : undefined,
    dateFrom: searchParamsPlain.dateFrom && typeof searchParamsPlain.dateFrom === "string"
      ? searchParamsPlain.dateFrom
      : undefined,
    dateTo: searchParamsPlain.dateTo && typeof searchParamsPlain.dateTo === "string"
      ? searchParamsPlain.dateTo
      : undefined,
  };

  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("manageExpeditions")}
        </h1>
      </div>

      <ExpeditionTable
        expeditions={expeditions || []}
        allWarehouses={warehouses}
        allSellers={sellers}
        allProviders={providers}
        allCountries={countries}
        pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
        error={success ? undefined : message}
        filters={clientFilters}
        currentUserRole={userRole}
      />
    </div>
  );
}
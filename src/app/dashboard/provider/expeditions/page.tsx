import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExpeditionFilters } from "@/types/expedition";
import { ExpeditionStatus, TransportMode, ProviderType } from "@/app/dashboard/_constant/expedition";
import { 
  getProviderExpeditions, 
  getAllWarehousesForExpedition, 
  getAllSellersForExpedition,
  getCountriesForExpedition
} from "@/app/actions/expedition";
import { UserRole } from "@/app/dashboard/_constant/user";
import ExpeditionTable from "../../seller/expeditions/_components/expedition-table";
import { getServerSession } from "next-auth";
import { authOptions } from '@/config/auth';
import User from "@/lib/db/models/user";

const ALL_STATUSES = "all_statuses";
const ALL_TRANSPORT_MODES = "all_transport_modes";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";
const ALL_COUNTRIES = "all_countries";
const ALL_WEIGHT_LEVELS = "all_weight_levels";

export const metadata: Metadata = {
  title: "My Expeditions | AvolShip",
  description: "Manage your assigned expeditions and track shipments",
};

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

  if (searchParams.dateFrom && typeof searchParams.dateFrom === "string") {
    filters.dateFrom = searchParams.dateFrom;
  }

  if (searchParams.dateTo && typeof searchParams.dateTo === "string") {
    filters.dateTo = searchParams.dateTo;
  }

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

export default async function ProviderExpeditionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParamsPlain = await searchParams;
  const t = await getTranslations("expeditions");
  
  const filters = await parseSearchParams(searchParamsPlain);

  if (!filters.page) filters.page = 1;
  if (!filters.limit) filters.limit = 10;

  const session = await getServerSession(authOptions);
  let userRole = UserRole.PROVIDER;
  
  if (session?.user?.id) {
    const user = await User.findById(session.user.id);
    if (user) {
      userRole = user.role;
    }
  }

  const { expeditions, pagination, success, message } = await getProviderExpeditions(
    filters.page,
    filters.limit,
    filters
  );

  const warehousesPromise = getAllWarehousesForExpedition();
  const sellersPromise = getAllSellersForExpedition();
  const countriesPromise = getCountriesForExpedition();
  
  const [warehouses, sellers, countries] = await Promise.all([
    warehousesPromise,
    sellersPromise,
    countriesPromise
  ]);

  const clientFilters: ExpeditionFilters & { 
    weightLevel?: string;
    transportMode?: string;
  } = {
    ...filters,
    status: searchParamsPlain.status && typeof searchParamsPlain.status === "string"
      ? (searchParamsPlain.status as ExpeditionStatus)
      : undefined,
    transportMode: searchParamsPlain.transportMode && typeof searchParamsPlain.transportMode === "string"
      ? searchParamsPlain.transportMode as any
      : undefined,
    warehouseId: searchParamsPlain.warehouseId && typeof searchParamsPlain.warehouseId === "string"
      ? searchParamsPlain.warehouseId
      : undefined,
    sellerId: searchParamsPlain.sellerId && typeof searchParamsPlain.sellerId === "string"
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
          {t("title")}
        </h1>
      </div>

      <ExpeditionTable
        expeditions={expeditions || []}
        allWarehouses={warehouses}
        allSellers={sellers}
        allProviders={[]}
        allCountries={countries}
        pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
        error={success ? undefined : message}
        filters={clientFilters}
        currentUserRole={userRole}
      />
    </div>
  );
}
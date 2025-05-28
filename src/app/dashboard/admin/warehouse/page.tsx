import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import WarehouseList from "./_components/warehouse-list";
import { WarehouseFilterParams } from "@/types/warehouse";
import { getAllCountries, getWarehouses } from "@/app/actions/warehouse";

const ALL_COUNTRIES = "all_countries";

export const metadata: Metadata = {
  title: "Warehouse Management | AvolShip",
  description: "Manage warehouses across multiple countries",
};

/**
 * Parse search params using a proper async approach
 */
async function parseSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const filters: WarehouseFilterParams = {};

  if (searchParams.search && typeof searchParams.search === "string") {
    filters.search = searchParams.search;
  }

  if (searchParams.country && typeof searchParams.country === "string") {
    if (searchParams.country !== ALL_COUNTRIES) {
      filters.country = searchParams.country;
    }
  }

  if (searchParams.isActive !== undefined) {
    const isActiveParam = searchParams.isActive;
    if (isActiveParam === "true") {
      filters.isActive = true;
    } else if (isActiveParam === "false") {
      filters.isActive = false;
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
 * Warehouse Management Page
 * This page displays the list of warehouses with filtering options and pagination
 */
export default async function WarehousePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("warehouse");
  const searchParamsPlain = await searchParams
  // Parse search params for filtering and pagination
  const filters = await parseSearchParams(searchParamsPlain);

  // Set default pagination values if not provided
  if (!filters.page) filters.page = 1;
  if (!filters.limit) filters.limit = 10;

  // Fetch warehouses with filters and pagination
  const { warehouses, pagination, error } = await getWarehouses(filters);

  // Fetch all available countries for the filter
  const { countries = [] } = await getAllCountries();

  // For client-side component, we need to pass the original searchParamsPlain values
  const clientFilters: WarehouseFilterParams = {
    ...filters,
    country:
      searchParamsPlain.country && typeof searchParamsPlain.country === "string"
        ? searchParamsPlain.country
        : ALL_COUNTRIES,
  };

  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("manageWarehouses")}
        </h1>
      </div>

      <WarehouseList
        warehouses={warehouses || []}
        allCountries={countries}
        pagination={pagination}
        error={error}
        filters={clientFilters}
      />
    </div>
  );
}

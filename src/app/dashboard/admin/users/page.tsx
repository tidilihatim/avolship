import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { UserFilters } from "@/types/user";
import { UserRole, UserStatus } from "@/lib/db/models/user";
import { getUsers } from "@/app/actions/user";
import UserTable from "./_components/user-table";


const ALL_ROLES = "all_roles";
const ALL_STATUSES = "all_statuses";
const ALL_COUNTRIES = "all_countries";

export const metadata: Metadata = {
  title: "User Management | AvolShip",
  description: "Manage users across multiple roles and permissions",
};

/**
 * Parse search params using a proper async approach
 */
async function parseSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const filters: UserFilters = {};

  if (searchParams.search && typeof searchParams.search === "string") {
    filters.search = searchParams.search;
  }

  if (searchParams.role && typeof searchParams.role === "string") {
    if (searchParams.role !== ALL_ROLES && Object.values(UserRole).includes(searchParams.role as UserRole)) {
      filters.role = searchParams.role as UserRole;
    }
  }

  if (searchParams.status && typeof searchParams.status === "string") {
    if (searchParams.status !== ALL_STATUSES && Object.values(UserStatus).includes(searchParams.status as UserStatus)) {
      filters.status = searchParams.status as UserStatus;
    }
  }

  if (searchParams.country && typeof searchParams.country === "string") {
    if (searchParams.country !== ALL_COUNTRIES) {
      filters.country = searchParams.country;
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
 * Get all countries from users (you can replace this with a proper server action)
 */
async function getAllCountries(): Promise<{ countries: string[] }> {
  try {
    // For now, we'll get countries from the users data
    // You can create a separate server action for this if needed
    const result = await getUsers(1, 1000, {}); // Get more users to extract countries
    
    if (result.success && result.users) {
      const countries = Array.from(
        new Set(
          result.users
            .map(user => user.country)
            .filter(Boolean)
        )
      ).sort();
      
      return { countries };
    }
    
    return { countries: [] };
  } catch (error) {
    console.error('Error fetching countries:', error);
    return { countries: [] };
  }
}

/**
 * User Management Page
 * This page displays the list of users with filtering options and pagination
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("users");
  const searchParamsPlain = await searchParams;
  
  // Parse search params for filtering and pagination
  const filters = await parseSearchParams(searchParamsPlain);

  // Set default pagination values if not provided
  if (!filters.page) filters.page = 1;
  if (!filters.limit) filters.limit = 10;

  // Fetch users with filters and pagination
  const { users, pagination, success, message } = await getUsers(
    filters.page,
    filters.limit,
    filters
  );

  // Fetch all available countries for the filter
  const { countries = [] } = await getAllCountries();

  // For client-side component, we need to pass the original searchParamsPlain values
  const clientFilters: UserFilters = {
    ...filters,
    role: searchParamsPlain.role && typeof searchParamsPlain.role === "string"
      ? (searchParamsPlain.role as UserRole)
      : undefined,
    status: searchParamsPlain.status && typeof searchParamsPlain.status === "string"
      ? (searchParamsPlain.status as UserStatus)
      : undefined,
    country: searchParamsPlain.country && typeof searchParamsPlain.country === "string"
      ? searchParamsPlain.country
      : undefined,
  };

  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("manageUsers")}
        </h1>
      </div>

      <UserTable
        users={users || []}
        allCountries={countries}
        pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
        error={success ? undefined : message}
        filters={clientFilters}
      />
    </div>
  );
}
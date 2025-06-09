"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, FilterX, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { UserRole } from "@/lib/db/models/user";
import { OrderStatus } from "@/lib/db/models/order";
import { getLoginUserRole } from "@/app/actions/auth";

import { CallCenterOrderFilters } from "./call-center-order-filters";
import { CallCenterOrderTableView } from "./call-center-order-table-view";

const ALL_STATUSES = "all_statuses";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";
const ALL_CALL_STATUSES = "all_call_statuses";

interface OrderProduct {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
}

interface CallAttempt {
  attemptNumber: number;
  phoneNumber: string;
  attemptDate: Date;
  status: "answered" | "unreached" | "busy" | "invalid";
  notes?: string;
  callCenterAgent?: {
    name: string;
    role: string;
  };
}

interface DoubleOrderReference {
  orderId: string;
  customerName: string;
  orderDate: Date;
  similarity: {
    sameName: boolean;
    samePhone: boolean;
    sameProduct: boolean;
    orderDateDifference: number;
  };
}

interface OrderTableData {
  _id: string;
  orderId: string;
  customer: {
    name: string;
    phoneNumbers: string[];
    shippingAddress: string;
  };
  warehouseId: string;
  warehouseName: string;
  warehouseCountry: string;
  sellerId: string;
  sellerName: string;
  products: OrderProduct[];
  totalPrice: number;
  status: OrderStatus;
  statusComment?: string;
  statusChangedBy?: {
    name: string;
    role: string;
  };
  statusChangedAt: Date;
  callAttempts: CallAttempt[];
  totalCallAttempts: number;
  lastCallAttempt?: Date;
  lastCallStatus?: "answered" | "unreached" | "busy" | "invalid";
  isDouble: boolean;
  doubleOrderReferences: DoubleOrderReference[];
  orderDate: Date;
  priority?: "urgent" | "high" | "normal";
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  warehouseId?: string;
  sellerId?: string;
  callStatus?: "answered" | "unreached" | "busy" | "invalid";
  dateFrom?: string;
  dateTo?: string;
  showDoubleOnly?: boolean;
  priority?: "urgent" | "high" | "normal";
  assignedAgent?: string;
  page?: number;
  limit?: number;
}

interface WarehouseOption {
  _id: string;
  name: string;
  country: string;
  currency: string;
}

interface SellerOption {
  _id: string;
  name: string;
  email: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CallCenterOrderTableProps {
  orders: OrderTableData[];
  allWarehouses?: WarehouseOption[];
  allSellers?: SellerOption[];
  pagination?: PaginationData;
  error?: string;
  filters: OrderFilters & { dateRange?: string };
}

export default function CallCenterOrderTable({
  orders,
  allWarehouses = [],
  allSellers = [],
  pagination,
  error,
  filters,
}: CallCenterOrderTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  const [search, setSearch] = useState(filters.search || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(filters.status || ALL_STATUSES);
  const [warehouseFilter, setWarehouseFilter] = useState(filters.warehouseId || ALL_WAREHOUSES);
  const [sellerFilter, setSellerFilter] = useState(filters.sellerId || ALL_SELLERS);
  const [callStatusFilter, setCallStatusFilter] = useState(filters.callStatus || ALL_CALL_STATUSES);
  const [priorityFilter, setPriorityFilter] = useState(filters.priority || "all_priorities");
  const [dateFromFilter, setDateFromFilter] = useState(filters.dateFrom || "");
  const [dateToFilter, setDateToFilter] = useState(filters.dateTo || "");
  const [showDoubleOnly, setShowDoubleOnly] = useState(filters.showDoubleOnly || false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(filters.limit || 20);

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

  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters({
      search: search || undefined,
      status: statusFilter !== ALL_STATUSES ? (statusFilter as OrderStatus) : undefined,
      warehouseId: warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      sellerId: isAdminOrModerator && sellerFilter !== ALL_SELLERS ? sellerFilter : undefined,
      callStatus: callStatusFilter !== ALL_CALL_STATUSES ? callStatusFilter : undefined,
      priority: priorityFilter !== "all_priorities" ? priorityFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      showDoubleOnly: showDoubleOnly || undefined,
      page: 1,
      limit: itemsPerPage,
    });
  };

  const applyFilters = () => {
    navigateWithFilters({
      search: search || undefined,
      status: statusFilter !== ALL_STATUSES ? (statusFilter as OrderStatus) : undefined,
      warehouseId: warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      sellerId: isAdminOrModerator && sellerFilter !== ALL_SELLERS ? sellerFilter : undefined,
      callStatus: callStatusFilter !== ALL_CALL_STATUSES ? callStatusFilter : undefined,
      priority: priorityFilter !== "all_priorities" ? priorityFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      showDoubleOnly: showDoubleOnly || undefined,
      page: 1,
      limit: itemsPerPage,
    });
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(ALL_STATUSES);
    setWarehouseFilter(ALL_WAREHOUSES);
    setSellerFilter(ALL_SELLERS);
    setCallStatusFilter(ALL_CALL_STATUSES);
    setPriorityFilter("all_priorities");
    setDateFromFilter("");
    setDateToFilter("");
    setShowDoubleOnly(false);
    navigateWithFilters({
      page: 1,
      limit: itemsPerPage,
    });
    setIsFiltersOpen(false);
  };

  const handlePageChange = (page: number) => {
    navigateWithFilters({
      ...filters,
      page,
    });
  };

  const handleItemsPerPageChange = (value: string) => {
    const limit = parseInt(value);
    setItemsPerPage(limit);
    navigateWithFilters({
      ...filters,
      page: 1,
      limit,
    });
  };

  const navigateWithFilters = (newFilters: any) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.append("search", newFilters.search);
    if (newFilters.status) params.append("status", newFilters.status);
    if (newFilters.warehouseId) params.append("warehouseId", newFilters.warehouseId);
    if (newFilters.sellerId) params.append("sellerId", newFilters.sellerId);
    if (newFilters.callStatus) params.append("callStatus", newFilters.callStatus);
    if (newFilters.priority) params.append("priority", newFilters.priority);
    if (newFilters.dateFrom) params.append("dateFrom", newFilters.dateFrom);
    if (newFilters.dateTo) params.append("dateTo", newFilters.dateTo);
    if (newFilters.showDoubleOnly) params.append("showDoubleOnly", "true");
    if (newFilters.page) params.append("page", newFilters.page.toString());
    if (newFilters.limit) params.append("limit", newFilters.limit.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  const renderPaginationItems = () => {
    if (!pagination) return null;

    const { page, totalPages } = pagination;
    const items = [];

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

    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      if (i <= 1 || i >= totalPages) continue;

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

    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("callCenter.orders")}</CardTitle>
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
              placeholder={t("callCenter.queue.orderDetails")}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="default">
            {t("orders.applyFilters")}
          </Button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                {t("orders.filters.title")}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-4 w-[400px] sm:w-[540px]">
              <SheetHeader className="px-1">
                <SheetTitle className="text-xl">{t("orders.filters.title")}</SheetTitle>
                <SheetDescription className="text-sm">
                  {t("callCenter.queue.title")}
                </SheetDescription>
              </SheetHeader>

              <CallCenterOrderFilters
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                warehouseFilter={warehouseFilter}
                setWarehouseFilter={setWarehouseFilter}
                sellerFilter={sellerFilter}
                setSellerFilter={setSellerFilter}
                callStatusFilter={callStatusFilter}
                setCallStatusFilter={setCallStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                dateFromFilter={dateFromFilter}
                setDateFromFilter={setDateFromFilter}
                dateToFilter={dateToFilter}
                setDateToFilter={setDateToFilter}
                showDoubleOnly={showDoubleOnly}
                setShowDoubleOnly={setShowDoubleOnly}
                allWarehouses={allWarehouses}
                allSellers={allSellers}
                isAdminOrModerator={isAdminOrModerator}
              />

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button onClick={applyFilters}>
                      {t("orders.applyFilters")}
                    </Button>
                  </SheetClose>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    {t("orders.clearFilters")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("callCenter.orders")}</span>
            <Badge variant="secondary" className="text-sm">
              {pagination?.total || 0} {t("callCenter.queue.orderDetails")}
            </Badge>
          </CardTitle>
          <CardDescription>
            {t("callCenter.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CallCenterOrderTableView 
            orders={orders}
            allWarehouses={allWarehouses}
            userRole={userRole}
            isAdminOrModerator={isAdminOrModerator}
          />
        </CardContent>

        {pagination && pagination.totalPages > 0 && (
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("orders.pagination.itemsPerPage")}
              </span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="20" />
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
              {t("orders.pagination.showing")}{" "}
              {pagination.total === 0
                ? 0
                : (pagination.page - 1) * pagination.limit + 1}
              -{Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              {t("orders.pagination.of")} {pagination.total}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
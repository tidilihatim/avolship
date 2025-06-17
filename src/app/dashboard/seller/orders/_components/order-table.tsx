"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PlusCircle, Upload, Users, Package } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Table, TableBody } from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { UserRole } from "@/lib/db/models/user";
import { getLoginUserRole } from "@/app/actions/auth";
import { assignOrderToAgent, autoAssignOrders } from "@/app/actions/call-center";
import { getCallCenterAgents } from "@/app/actions/user";
import StatusUpdateDialog from "./order-table/status-update-dialog";

// Import new components
import OrderSearchBar from "./order-table/order-search-bar";
import OrderFiltersSheet from "./order-table/order-filters-sheet";
import OrderTableHeader from "./order-table/order-table-header";
import OrderTableRow from "./order-table/order-table-row";
import OrderPagination from "./order-table/order-pagination";
import OrderAssignmentDialog from "./order-table/order-assignment-dialog";

// Import types and constants
import {
  OrderTableProps,
  OrderTableData,
  ALL_STATUSES,
  ALL_WAREHOUSES,
  ALL_SELLERS,
  ALL_CALL_STATUSES,
  CUSTOM_DATE_RANGE,
} from "./order-table/order-table-types";
import { OrderStatus } from "@/lib/db/models/order";

export default function OrderTable({
  orders,
  allWarehouses = [],
  allSellers = [],
  pagination,
  error,
  filters,
}: OrderTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  // State for search and filters
  const [search, setSearch] = useState(filters.search || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(
    filters.status || ALL_STATUSES
  );
  const [warehouseFilter, setWarehouseFilter] = useState(
    filters.warehouseId || ALL_WAREHOUSES
  );
  const [sellerFilter, setSellerFilter] = useState(
    filters.sellerId || ALL_SELLERS
  );
  const [callStatusFilter, setCallStatusFilter] = useState(
    filters.callStatus || ALL_CALL_STATUSES
  );
  const [dateFromFilter, setDateFromFilter] = useState(filters.dateFrom || "");
  const [dateToFilter, setDateToFilter] = useState(filters.dateTo || "");
  const [showDoubleOnly, setShowDoubleOnly] = useState(
    filters.showDoubleOnly || false
  );
  const [dateRangePreset, setDateRangePreset] = useState(
    filters.dateRange || CUSTOM_DATE_RANGE
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(filters.limit || 10);

  // State for status update dialog
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    isOpen: boolean;
    order: OrderTableData | null;
  }>({
    isOpen: false,
    order: null,
  });

  // State for assignment dialog
  const [assignmentDialog, setAssignmentDialog] = useState<{
    isOpen: boolean;
    order: OrderTableData | null;
  }>({
    isOpen: false,
    order: null,
  });

  // State for call center agents
  const [callCenterAgents, setCallCenterAgents] = useState<Array<{
    _id: string;
    name: string;
    email: string;
  }>>([]);

  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch current user role and call center agents on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await getLoginUserRole();
        setUserRole(role);
        
        // If user is admin/moderator, fetch call center agents
        if (role === UserRole.ADMIN || role === UserRole.MODERATOR) {
          const agentsResult = await getCallCenterAgents();
          if (agentsResult.success) {
            setCallCenterAgents(agentsResult.agents);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  // Check if user is admin or moderator
  const isAdminOrModerator =
    userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters({
      search: search || undefined,
      status:
        statusFilter !== ALL_STATUSES
          ? (statusFilter as OrderStatus)
          : undefined,
      warehouseId:
        warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      sellerId:
        isAdminOrModerator && sellerFilter !== ALL_SELLERS
          ? sellerFilter
          : undefined,
      callStatus:
        callStatusFilter !== ALL_CALL_STATUSES ? callStatusFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      showDoubleOnly: showDoubleOnly || undefined,
      page: 1,
      limit: itemsPerPage,
    });
  };

  // Apply filters
  const applyFilters = () => {
    navigateWithFilters({
      search: search || undefined,
      status:
        statusFilter !== ALL_STATUSES
          ? (statusFilter as OrderStatus)
          : undefined,
      warehouseId:
        warehouseFilter !== ALL_WAREHOUSES ? warehouseFilter : undefined,
      sellerId:
        isAdminOrModerator && sellerFilter !== ALL_SELLERS
          ? sellerFilter
          : undefined,
      callStatus:
        callStatusFilter !== ALL_CALL_STATUSES ? callStatusFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      showDoubleOnly: showDoubleOnly || undefined,
      page: 1,
      limit: itemsPerPage,
    });
    setIsFiltersOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setStatusFilter(ALL_STATUSES);
    setWarehouseFilter(ALL_WAREHOUSES);
    setSellerFilter(ALL_SELLERS);
    setCallStatusFilter(ALL_CALL_STATUSES);
    setDateFromFilter("");
    setDateToFilter("");
    setShowDoubleOnly(false);
    setDateRangePreset(CUSTOM_DATE_RANGE);
    setDateRangePreset("");
    navigateWithFilters({
      page: 1,
      limit: itemsPerPage,
    });
    setIsFiltersOpen(false);
  };

  // Handle date range presets
  const handleDateRangePreset = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    let fromDate = "";
    let toDate = today.toISOString().split("T")[0];

    switch (preset) {
      case "today":
        fromDate = today.toISOString().split("T")[0];
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        fromDate = yesterday.toISOString().split("T")[0];
        toDate = fromDate;
        break;
      case "lastWeek":
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        fromDate = lastWeek.toISOString().split("T")[0];
        break;
      case "lastMonth":
        const lastMonth = new Date(today);
        lastMonth.setDate(lastMonth.getDate() - 30);
        fromDate = lastMonth.toISOString().split("T")[0];
        break;
      default:
        fromDate = "";
        toDate = "";
    }

    setDateFromFilter(fromDate);
    setDateToFilter(toDate);
  };

  // Change page
  const handlePageChange = (page: number) => {
    navigateWithFilters({
      ...filters,
      page,
    });
  };

  // Change items per page
  const handleItemsPerPageChange = (value: string) => {
    const limit = parseInt(value);
    setItemsPerPage(limit);
    navigateWithFilters({
      ...filters,
      page: 1,
      limit,
    });
  };

  // Helper function to navigate with filters
  const navigateWithFilters = (newFilters: any) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.append("search", newFilters.search);
    if (newFilters.status) params.append("status", newFilters.status);
    if (newFilters.warehouseId)
      params.append("warehouseId", newFilters.warehouseId);
    if (newFilters.sellerId) params.append("sellerId", newFilters.sellerId);
    if (newFilters.callStatus)
      params.append("callStatus", newFilters.callStatus);
    if (newFilters.dateFrom) params.append("dateFrom", newFilters.dateFrom);
    if (newFilters.dateTo) params.append("dateTo", newFilters.dateTo);
    if (newFilters.showDoubleOnly) params.append("showDoubleOnly", "true");
    if (newFilters.page) params.append("page", newFilters.page.toString());
    if (newFilters.limit) params.append("limit", newFilters.limit.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  // Status update dialog handlers
  const openStatusUpdateDialog = (order: OrderTableData) => {
    setStatusUpdateDialog({
      isOpen: true,
      order,
    });
  };

  const closeStatusUpdateDialog = () => {
    setStatusUpdateDialog({
      isOpen: false,
      order: null,
    });
  };

  // Assignment dialog handlers
  const openAssignmentDialog = (order: OrderTableData) => {
    setAssignmentDialog({
      isOpen: true,
      order,
    });
    setSelectedAgent("");
  };

  const closeAssignmentDialog = () => {
    setAssignmentDialog({
      isOpen: false,
      order: null,
    });
    setSelectedAgent("");
  };

  // Handle order assignment
  const handleAssignOrder = async () => {
    if (!selectedAgent || !assignmentDialog.order) {
      toast.error("Please select an agent");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignOrderToAgent(assignmentDialog.order._id, selectedAgent);
      
      if (result.success) {
        toast.success(result.message);
        closeAssignmentDialog();
        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error assigning order:", error);
      toast.error("Failed to assign order");
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle auto-assignment
  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const result = await autoAssignOrders(20);
      
      if (result.success) {
        toast.success(result.message);
        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error auto-assigning orders:", error);
      toast.error("Failed to auto-assign orders");
    } finally {
      setIsAssigning(false);
    }
  };

  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("orders.title")}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <OrderSearchBar
          search={search}
          onSearchChange={setSearch}
          onSubmit={handleSearch}
        />

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <OrderFiltersSheet
            isOpen={isFiltersOpen}
            onOpenChange={setIsFiltersOpen}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sellerFilter={sellerFilter}
            onSellerFilterChange={setSellerFilter}
            callStatusFilter={callStatusFilter}
            onCallStatusFilterChange={setCallStatusFilter}
            dateFromFilter={dateFromFilter}
            onDateFromFilterChange={setDateFromFilter}
            dateToFilter={dateToFilter}
            onDateToFilterChange={setDateToFilter}
            showDoubleOnly={showDoubleOnly}
            onShowDoubleOnlyChange={setShowDoubleOnly}
            dateRangePreset={dateRangePreset}
            onDateRangePresetChange={handleDateRangePreset}
            allSellers={allSellers}
            isAdminOrModerator={isAdminOrModerator}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
          />

          {isAdminOrModerator && (
            <Button 
              variant="outline"
              className="flex gap-2 mr-2"
              onClick={handleAutoAssign}
              disabled={isAssigning}
            >
              <Users className="h-4 w-4" />
              {isAssigning ? "Auto-Assigning..." : "Auto-Assign Orders"}
            </Button>
          )}
          <Link href={`/dashboard/${userRole}/orders/import`} passHref>
            <Button variant="outline" className="flex gap-2">
              <Upload className="h-4 w-4" />
              {t("orders.importOrders")}
            </Button>
          </Link>
          <Link href={`/dashboard/${userRole}/orders/create`} passHref>
            <Button className="flex gap-2">
              <PlusCircle className="h-4 w-4" />
              {t("orders.addOrder")}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("orders.title")}</CardTitle>
          <CardDescription>
            {pagination?.total
              ? `${pagination.total} ${
                  pagination.total === 1 ? "order" : "orders"
                } found`
              : t("orders.noOrdersFound")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <OrderTableHeader isAdminOrModerator={isAdminOrModerator} />
                <TableBody>
                  {orders.map((order) => (
                    <OrderTableRow
                      key={order._id}
                      order={order}
                      allWarehouses={allWarehouses}
                      isAdminOrModerator={isAdminOrModerator}
                      userRole={userRole}
                      onStatusUpdate={openStatusUpdateDialog}
                      onAssignOrder={openAssignmentDialog}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                {t("orders.noOrdersFound")}
              </p>
            </div>
          )}
        </CardContent>

        {pagination && (
          <OrderPagination
            pagination={pagination}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </Card>

      {/* Status Update Dialog */}
      {statusUpdateDialog.order && (
        <StatusUpdateDialog
          isOpen={statusUpdateDialog.isOpen}
          onClose={closeStatusUpdateDialog}
          order={statusUpdateDialog.order}
        />
      )}

      {/* Assignment Dialog */}
      <OrderAssignmentDialog
        isOpen={assignmentDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) closeAssignmentDialog();
        }}
        order={assignmentDialog.order}
        callCenterAgents={callCenterAgents}
        selectedAgent={selectedAgent}
        onSelectedAgentChange={setSelectedAgent}
        isAssigning={isAssigning}
        onAssign={handleAssignOrder}
      />
    </div>
  );
}

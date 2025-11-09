"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PlusCircle, Upload, Users, Package } from "lucide-react";
import { useSocket } from "@/lib/socket/use-socket";
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
import { assignOrderToAgent, updateCustomerInfo } from "@/app/actions/call-center";
import { getCallCenterAgents } from "@/app/actions/user";
import { getAccessToken } from "@/app/actions/cookie";
import { getAppSettings } from "@/app/actions/app-settings";
import StatusUpdateDialog from "./order-table/status-update-dialog";

// Import new components
import OrderSearchBar from "./order-table/order-search-bar";
import OrderFiltersSheet from "./order-table/order-filters-sheet";
import OrderTableHeader from "./order-table/order-table-header";
import OrderTableRow from "./order-table/order-table-row";
import OrderPagination from "./order-table/order-pagination";
import OrderAssignmentDialog from "./order-table/order-assignment-dialog";
import RiderAssignmentDialog from "./order-table/rider-assignment-dialog";
import CustomerUpdateDialog, { CustomerUpdateData } from "./order-table/customer-update-dialog";
import DiscountDialog from "./order-table/discount-dialog";
import ColumnToggle from "./order-table/column-toggle";
import { useColumnVisibility } from "./order-table/use-column-visibility";

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
  const [phaseFilter, setPhaseFilter] = useState<'confirmation' | 'shipping' | undefined>(
    filters.phase
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

  // State for rider assignment dialog
  const [riderAssignmentDialog, setRiderAssignmentDialog] = useState<{
    isOpen: boolean;
    order: OrderTableData | null;
  }>({
    isOpen: false,
    order: null,
  });

  // State for customer update dialog
  const [customerUpdateDialog, setCustomerUpdateDialog] = useState<{
    isOpen: boolean;
    order: OrderTableData | null;
  }>({
    isOpen: false,
    order: null,
  });

  // State for discount dialog
  const [discountDialog, setDiscountDialog] = useState<{
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

  // State for delivery riders
  const [deliveryRiders, setDeliveryRiders] = useState<Array<{
    _id: string;
    name: string;
    email: string;
    country: string;
  }>>([]);

  const [selectedRider, setSelectedRider] = useState<string>("");
  const [isAssigningRider, setIsAssigningRider] = useState(false);

  // Customer update state
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);

  // App settings state for tracking permissions and delivery proof
  const [trackingSettings, setTrackingSettings] = useState<{
    seller: boolean;
    call_center: boolean;
  } | null>(null);
  const [showDeliveryProofToSeller, setShowDeliveryProofToSeller] = useState<boolean>(false);

  // Column visibility management
  const { columnVisibility, setColumnVisibility } = useColumnVisibility();

  // Socket connection for real-time updates
  const { on } = useSocket();

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

        // Fetch app settings for tracking permissions and delivery proof
        const settingsResult = await getAppSettings();
        if (settingsResult.success) {
          setTrackingSettings(settingsResult.data.showLocationTracking);
          setShowDeliveryProofToSeller(settingsResult.data.showDeliveryProofToSeller);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  // Listen for new seller orders via socket
  useEffect(() => {
    if (!on) return;

    const unsubscribe = on('order:new-seller', () => {
      // Refresh the page to fetch new orders
      router.refresh();
      toast.success(t("orders.newOrderReceived"));
    });

    return unsubscribe;
  }, [on, router]);

  // Check if user is admin or moderator
  const isAdminOrModerator =
    userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  // Check if tracking is allowed for current user
  const isTrackingAllowed = () => {
    if (!trackingSettings) return false;
    
    switch (userRole) {
      case UserRole.SELLER:
        return trackingSettings.seller;
      case UserRole.CALL_CENTER:
        return trackingSettings.call_center;
      case UserRole.ADMIN:
      case UserRole.MODERATOR:
        return true; // Admins always have access
      default:
        return false;
    }
  };

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
      phase: phaseFilter || undefined,
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
    setPhaseFilter(undefined);
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
    if (newFilters.phase) params.append("phase", newFilters.phase);
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

  // Rider assignment dialog handlers
  const openRiderAssignmentDialog = (order: OrderTableData) => {
    setRiderAssignmentDialog({
      isOpen: true,
      order,
    });
    setSelectedRider("");
  };

  const closeRiderAssignmentDialog = () => {
    setRiderAssignmentDialog({
      isOpen: false,
      order: null,
    });
    setSelectedRider("");
  };

  // Customer update dialog handlers
  const openCustomerUpdateDialog = (order: OrderTableData) => {
    setCustomerUpdateDialog({
      isOpen: true,
      order,
    });
  };

  const closeCustomerUpdateDialog = () => {
    setCustomerUpdateDialog({
      isOpen: false,
      order: null,
    });
  };

  // Discount dialog handlers
  const openDiscountDialog = (order: OrderTableData) => {
    setDiscountDialog({
      isOpen: true,
      order,
    });
  };

  const closeDiscountDialog = () => {
    setDiscountDialog({
      isOpen: false,
      order: null,
    });
  };

  // Handle order assignment
  const handleAssignOrder = async () => {
    if (!selectedAgent || !assignmentDialog.order) {
      toast.error(t("orders.errors.pleaseSelectAgent"));
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
      toast.error(t("orders.errors.failedToAssignOrder"));
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle rider assignment
  const handleAssignRider = async () => {
    if (!selectedRider || !riderAssignmentDialog.order) {
      toast.error(t("orders.errors.pleaseSelectRider"));
      return;
    }

    setIsAssigningRider(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast.error(t("orders.errors.authRequired"));
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/orders/assign-rider`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: riderAssignmentDialog.order._id,
          riderId: selectedRider,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message || t("orders.success.riderAssignedSuccess"));
        closeRiderAssignmentDialog();
        router.refresh();
      } else {
        toast.error(result.message || t("orders.errors.failedToAssignRider"));
      }
    } catch (error) {
      console.error("Error assigning rider:", error);
      toast.error(t("orders.errors.failedToAssignRider"));
    } finally {
      setIsAssigningRider(false);
    }
  };

  // Handle customer update
  const handleCustomerUpdate = async (customerData: CustomerUpdateData) => {
    if (!customerUpdateDialog.order) {
      toast.error(t("orders.errors.noOrderSelected"));
      return;
    }

    setIsUpdatingCustomer(true);
    try {
      const result = await updateCustomerInfo(customerUpdateDialog.order._id, customerData);

      if (result.success) {
        toast.success(result.message || t("orders.success.customerUpdatedSuccess"));
        closeCustomerUpdateDialog();
        router.refresh();
      } else {
        toast.error(result.message || t("orders.errors.failedToUpdateCustomer"));
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error(t("orders.errors.failedToUpdateCustomer"));
    } finally {
      setIsUpdatingCustomer(false);
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

        <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-between sm:justify-end">
          <ColumnToggle
            isAdminOrModerator={isAdminOrModerator}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />

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
            phaseFilter={phaseFilter}
            onPhaseFilterChange={setPhaseFilter}
            dateRangePreset={dateRangePreset}
            onDateRangePresetChange={handleDateRangePreset}
            allSellers={allSellers}
            isAdminOrModerator={isAdminOrModerator}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
          />

          {userRole === UserRole.SELLER && (
            <>
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
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("orders.title")}</CardTitle>
          <CardDescription>
            {pagination?.total
              ? t("orders.pagination.showingXofY", {
                  start: ((pagination.page - 1) * pagination.limit + 1).toString(),
                  end: Math.min(pagination.page * pagination.limit, pagination.total).toString(),
                  total: pagination.total.toString()
                })
              : t("orders.noOrdersFound")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <OrderTableHeader
                  isAdminOrModerator={isAdminOrModerator}
                  columnVisibility={columnVisibility}
                />
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
                      onAssignRider={openRiderAssignmentDialog}
                      onEditCustomer={openCustomerUpdateDialog}
                      onApplyDiscount={openDiscountDialog}
                      columnVisibility={columnVisibility}
                      isTrackingAllowed={isTrackingAllowed()}
                      showDeliveryProofToSeller={showDeliveryProofToSeller}
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

      {/* Rider Assignment Dialog */}
      <RiderAssignmentDialog
        isOpen={riderAssignmentDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) closeRiderAssignmentDialog();
        }}
        order={riderAssignmentDialog.order}
        selectedRider={selectedRider}
        onSelectedRiderChange={setSelectedRider}
        isAssigning={isAssigningRider}
        onAssign={handleAssignRider}
      />

      {/* Customer Update Dialog */}
      <CustomerUpdateDialog
        isOpen={customerUpdateDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) closeCustomerUpdateDialog();
        }}
        order={customerUpdateDialog.order}
        isUpdating={isUpdatingCustomer}
        onUpdate={handleCustomerUpdate}
      />

      {/* Discount Dialog */}
      {discountDialog.order && (
        <DiscountDialog
          isOpen={discountDialog.isOpen}
          onClose={closeDiscountDialog}
          order={discountDialog.order}
          onDiscountApplied={() => {
            closeDiscountDialog();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

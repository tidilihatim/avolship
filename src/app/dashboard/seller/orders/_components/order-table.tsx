"use client";

// src/app/[locale]/dashboard/orders/_components/order-table.tsx
import { useState, useTransition, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Globe, PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Search,
  FilterX,
  Filter,
  MoreHorizontal,
  Eye,
  Phone,
  MapPin,
  Package,
  AlertTriangle,
  History,
  Users,
  Calendar,
  Clock,
  PhoneCall,
  User,
  Building,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { OrderStatus } from "@/lib/db/models/order";
import { UserRole } from "@/lib/db/models/user";
import { getLoginUserRole } from "@/app/actions/auth";
import StatusUpdateDialog from "./status-update-dialog";
import { assignOrderToAgent, autoAssignOrders } from "@/app/actions/call-center";
import { getCallCenterAgents } from "@/app/actions/user";

// Constants for filter values
const ALL_STATUSES = "all_statuses";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";
const ALL_CALL_STATUSES = "all_call_statuses";

// Interfaces
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
  page?: number;
  limit?: number;
}

interface WarehouseOption {
  _id: string;
  name: string;
  country: string;
  currency: string; // Added currency field
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

interface OrderTableProps {
  orders: OrderTableData[];
  allWarehouses?: WarehouseOption[];
  allSellers?: SellerOption[];
  pagination?: PaginationData;
  error?: string;
  filters: OrderFilters & { dateRange?: string };
}

/**
 * OrderTable Component
 * Displays orders with comprehensive filtering, search, pagination and management capabilities
 */
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
  const CUSTOM_DATE_RANGE = "custom_range";
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

  // Generate pagination items
  const renderPaginationItems = () => {
    if (!pagination) return null;

    const { page, totalPages } = pagination;
    const items = [];

    // Previous button
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

    // First page
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

    // Ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Pages around current page
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

    // Ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Last page (if more than one page)
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

    // Next button
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

  // Get status badge styling
  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.PENDING]: {
        label: t("orders.statuses.pending"),
        className:
          "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200",
      },
      [OrderStatus.CONFIRMED]: {
        label: t("orders.statuses.confirmed"),
        className:
          "bg-green-50 text-green-700 hover:bg-green-50 border-green-200",
      },
      [OrderStatus.CANCELLED]: {
        label: t("orders.statuses.cancelled"),
        className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200",
      },
      [OrderStatus.WRONG_NUMBER]: {
        label: t("orders.statuses.wrong_number"),
        className:
          "bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-200",
      },
      [OrderStatus.DOUBLE]: {
        label: t("orders.statuses.double"),
        className:
          "bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200",
      },
      [OrderStatus.UNREACHED]: {
        label: t("orders.statuses.unreached"),
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      },
      [OrderStatus.EXPIRED]: {
        label: t("orders.statuses.expired"),
        className:
          "bg-slate-50 text-slate-700 hover:bg-slate-50 border-slate-200",
      },
    };

    return (
      statusConfig[status] || {
        label: "Unknown",
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      }
    );
  };

  // Get call status badge
  const getCallStatusBadge = (
    status: "answered" | "unreached" | "busy" | "invalid"
  ) => {
    const statusConfig = {
      answered: {
        label: t("orders.callStatuses.answered"),
        className:
          "bg-green-50 text-green-700 hover:bg-green-50 border-green-200",
      },
      unreached: {
        label: t("orders.callStatuses.unreached"),
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      },
      busy: {
        label: t("orders.callStatuses.busy"),
        className:
          "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200",
      },
      invalid: {
        label: t("orders.callStatuses.invalid"),
        className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200",
      },
    };

    return statusConfig[status];
  };

  // Format price with currency based on warehouse
  const formatPrice = (price: number, warehouseId?: string) => {
    // Find warehouse to get currency
    const warehouse = allWarehouses.find((w) => w._id === warehouseId);
    const currency = warehouse?.currency || "USD";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("messages.copiedToClipboard"));
    } catch (error) {
      toast.error(t("messages.failedToCopy"));
    }
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
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("orders.searchOrders")}
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
                  {t("orders.applyFilters")}
                </SheetDescription>
              </SheetHeader>

              <div className="py-8 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Status Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("orders.filters.filterByStatus")}
                  </h3>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("orders.filters.allStatuses")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_STATUSES}>
                        {t("orders.filters.allStatuses")}
                      </SelectItem>
                      {Object.values(OrderStatus)
                        .filter((status) => status !== OrderStatus.DOUBLE)
                        .map((status) => (
                          <SelectItem key={status} value={status}>
                            {getStatusBadge(status).label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seller Filter (Admin/Moderator only) */}
                {isAdminOrModerator && allSellers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium leading-tight">
                      {t("orders.filters.filterBySeller")}
                    </h3>
                    <Select
                      value={sellerFilter}
                      onValueChange={setSellerFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("orders.filters.allSellers")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_SELLERS}>
                          {t("orders.filters.allSellers")}
                        </SelectItem>
                        {allSellers.map((seller) => (
                          <SelectItem key={seller._id} value={seller._id}>
                            {seller.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Call Status Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("orders.filters.filterByCallStatus")}
                  </h3>
                  <Select
                    value={callStatusFilter}
                    onValueChange={setCallStatusFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("orders.filters.allCallStatuses")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CALL_STATUSES}>
                        {t("orders.filters.allCallStatuses")}
                      </SelectItem>
                      <SelectItem value="answered">
                        {t("orders.callStatuses.answered")}
                      </SelectItem>
                      <SelectItem value="unreached">
                        {t("orders.callStatuses.unreached")}
                      </SelectItem>
                      <SelectItem value="busy">
                        {t("orders.callStatuses.busy")}
                      </SelectItem>
                      <SelectItem value="invalid">
                        {t("orders.callStatuses.invalid")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t("orders.filters.filterByDate")}
                  </h3>
                  <div className="space-y-3">
                    <Select
                      value={dateRangePreset}
                      onValueChange={handleDateRangePreset}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("orders.filters.dateRange")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CUSTOM_DATE_RANGE}>
                          {t("orders.filters.customRange")}
                        </SelectItem>
                        <SelectItem value="today">
                          {t("orders.filters.today")}
                        </SelectItem>
                        <SelectItem value="yesterday">
                          {t("orders.filters.yesterday")}
                        </SelectItem>
                        <SelectItem value="lastWeek">
                          {t("orders.filters.lastWeek")}
                        </SelectItem>
                        <SelectItem value="lastMonth">
                          {t("orders.filters.lastMonth")}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="dateFrom" className="text-xs">
                          {t("orders.filters.from")}
                        </Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateTo" className="text-xs">
                          {t("orders.filters.to")}
                        </Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Double Orders Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showDoubleOnly"
                      checked={showDoubleOnly}
                      onCheckedChange={() => setShowDoubleOnly(!showDoubleOnly)}
                    />
                    <Label
                      htmlFor="showDoubleOnly"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t("orders.filters.filterByDoubleOrders")}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("orders.fields.orderId")}</TableHead>
                    <TableHead>{t("orders.fields.customer")}</TableHead>
                    <TableHead className="table-cell">
                      {t("orders.fields.warehouse")}
                    </TableHead>
                    {isAdminOrModerator && (
                      <TableHead className="table-cell">
                        {t("orders.fields.seller")}
                      </TableHead>
                    )}
                    {isAdminOrModerator && (
                      <TableHead className="table-cell">
                        {t("orders.fields.assignedAgent")}
                      </TableHead>
                    )}
                    <TableHead className="table-cell">
                      {t("orders.fields.products")}
                    </TableHead>
                    <TableHead>{t("orders.fields.totalPrice")}</TableHead>
                    <TableHead>{t("orders.fields.status")}</TableHead>
                    <TableHead className="table-cell">
                      {t("orders.fields.callAttempts")}
                    </TableHead>
                    <TableHead className="table-cell">
                      {t("orders.fields.orderDate")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                              {order.orderId}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(order.orderId)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {order.isDouble && (
                            <Badge
                              variant="outline"
                              className="w-fit bg-purple-50 text-purple-700 border-purple-200"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              {t("orders.badges.doubleOrder")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto w-full p-2 justify-start"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-sm">
                                    {order.customer.name}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {order.customer.phoneNumbers.length} phone
                                    {order.customer.phoneNumbers.length > 1
                                      ? "s"
                                      : ""}
                                  </Badge>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </Button>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="px-2 pb-2 overflow-hidden transition-all duration-500 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                            <div className="space-y-2 bg-muted/50 p-3 rounded-md border max-h-64 overflow-y-auto">
                              <div>
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                                  <Phone className="h-3 w-3" />
                                  Phone Numbers
                                </div>
                                <div className="space-y-1">
                                  {order.customer.phoneNumbers.map(
                                    (phone, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between bg-background p-2 rounded border"
                                      >
                                        <span className="font-mono text-sm">
                                          {phone}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(phone);
                                          }}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                                  <MapPin className="h-3 w-3" />
                                  Shipping Address
                                </div>
                                <div className="bg-background p-3 rounded border">
                                  <p className="text-sm leading-relaxed">
                                    {order.customer.shippingAddress}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {order.warehouseName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {order.warehouseCountry}
                          </div>
                        </div>
                      </TableCell>

                      {isAdminOrModerator && (
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {order.sellerName}
                            </span>
                          </div>
                        </TableCell>
                      )}

                      {isAdminOrModerator && (
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            {order.assignedAgent ? (
                              <>
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600">
                                  {order.assignedAgent}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500 italic">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      <TableCell className="hidden xl:table-cell">
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto w-full p-2 justify-start"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">
                                    {order.products.length}{" "}
                                    {order.products.length === 1
                                      ? "item"
                                      : "items"}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {formatPrice(
                                      order.totalPrice,
                                      order.warehouseId
                                    )}
                                  </Badge>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </Button>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="px-2 pb-2 overflow-hidden transition-all duration-500 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                            <div className="space-y-2 bg-muted/50 p-3 rounded-md border max-h-64 overflow-y-auto">
                              {order.products.map((product, index) => (
                                <div
                                  key={index}
                                  className="bg-background p-3 rounded border"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                      <h4 className="font-medium text-sm leading-tight">
                                        {/* show only the first 50 characters */}
                                        {product.productName?.slice(0, 50) +
                                          (product.productName?.length > 50
                                            ? "..."
                                            : "")}
                                      </h4>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs ml-2"
                                      >
                                        #{index + 1}
                                      </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="space-y-1">
                                        <div className="text-muted-foreground">
                                          Product Code
                                        </div>
                                        <div className="font-mono bg-muted px-2 py-1 rounded">
                                          {product.productCode}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t">
                                      <div className="flex items-center gap-4 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">
                                            Qty:
                                          </span>
                                          <span className="font-medium ml-1">
                                            {product.quantity}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">
                                            Unit Price:
                                          </span>
                                          <span className="font-medium ml-1">
                                            {formatPrice(
                                              product.unitPrice,
                                              order.warehouseId
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs text-muted-foreground">
                                          Subtotal
                                        </div>
                                        <div className="font-semibold">
                                          {formatPrice(
                                            product.unitPrice *
                                              product.quantity,
                                            order.warehouseId
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <div className="bg-primary/10 border-primary/20 p-3 rounded border-2 mt-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    Order Total
                                  </span>
                                  <span className="font-bold text-lg">
                                    {formatPrice(
                                      order.totalPrice,
                                      order.warehouseId
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>

                      <TableCell className="font-semibold text-lg">
                        {formatPrice(order.totalPrice, order.warehouseId)}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                          <Badge
                            variant="outline"
                            className={getStatusBadge(order.status).className}
                          >
                            {getStatusBadge(order.status).label}
                          </Badge>
                          {order.statusComment && (
                            <div className="text-xs text-muted-foreground bg-muted p-2 rounded border max-w-[150px]">
                              <div className="font-medium mb-1">Comment:</div>
                              <div className="leading-tight overflow-hidden">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help truncate max-w-full">
                                        {order.statusComment.length > 30 
                                          ? `${order.statusComment.substring(0, 30)}...`
                                          : order.statusComment
                                        }
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="whitespace-pre-wrap break-words">
                                        {order.statusComment}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <PhoneCall className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {order.totalCallAttempts} attempts
                            </span>
                          </div>
                          {order.totalCallAttempts > 0 && (
                            <div className="space-y-1">
                              {order.lastCallStatus && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    getCallStatusBadge(order.lastCallStatus)
                                      ?.className
                                  }`}
                                >
                                  {
                                    getCallStatusBadge(order.lastCallStatus)
                                      ?.label
                                  }
                                </Badge>
                              )}
                              {order.lastCallAttempt && (
                                <div className="text-xs text-muted-foreground">
                                  Last: {formatDate(order.lastCallAttempt)}
                                </div>
                              )}
                            </div>
                          )}
                          {order.totalCallAttempts === 0 && (
                            <div className="text-xs text-muted-foreground italic">
                              No calls made
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {formatDate(order.orderDate)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {/* You can add relative time here if needed */}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {t("common.actions")}
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              className="cursor-pointer"
                              asChild
                            >
                              <Link
                                href={`/dashboard/${userRole}/orders/${order._id}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.view")}
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="cursor-pointer"
                              asChild
                            >
                              <Link
                                href={`/dashboard/${userRole}/orders/${order._id}#history`}
                              >
                                <History className="mr-2 h-4 w-4" />
                                {t("orders.statusHistory.title")}
                              </Link>
                            </DropdownMenuItem>

                            {order.isDouble &&
                              order.doubleOrderReferences.length > 0 && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  asChild
                                >
                                  <Link
                                    href={`/dashboard/${userRole}/orders/${order._id}#double`}
                                  >
                                    <Users className="mr-2 h-4 w-4" />
                                    {t("orders.viewDoubleOrders")}
                                  </Link>
                                </DropdownMenuItem>
                              )}

                            <DropdownMenuSeparator />

                            {/* Call Center Actions */}
                            {(userRole === UserRole.CALL_CENTER ||
                              isAdminOrModerator) && (
                              <>
                                <DropdownMenuItem className="cursor-pointer">
                                  <PhoneCall className="mr-2 h-4 w-4" />
                                  Make Call
                                </DropdownMenuItem>

                                <DropdownMenuItem className="cursor-pointer">
                                  <Phone className="mr-2 h-4 w-4" />
                                  View Call History
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* Admin/Moderator Actions */}
                            {isAdminOrModerator && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => openStatusUpdateDialog(order)}
                                >
                                  {t("orders.actions.updateStatus")}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => openAssignmentDialog(order)}
                                >
                                  {t("orders.actions.assignToAgent")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
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
                  <SelectValue placeholder="10" />
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

      {/* Status Update Dialog */}
      {statusUpdateDialog.order && (
        <StatusUpdateDialog
          isOpen={statusUpdateDialog.isOpen}
          onClose={closeStatusUpdateDialog}
          order={statusUpdateDialog.order}
        />
      )}

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialog.isOpen} onOpenChange={(open) => {
        if (!open) closeAssignmentDialog();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Order to Agent</DialogTitle>
            <DialogDescription>
              Select a call center agent to assign order {assignmentDialog.order?.orderId} to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="agent-select" className="text-sm font-medium">
                Select Call Center Agent
              </label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {callCenterAgents.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name} ({agent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeAssignmentDialog}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignOrder}
              disabled={isAssigning || !selectedAgent}
            >
              {isAssigning ? "Assigning..." : "Assign Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

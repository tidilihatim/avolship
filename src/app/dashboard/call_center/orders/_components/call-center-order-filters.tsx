"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { OrderStatus } from "@/lib/db/models/order";

const ALL_STATUSES = "all_statuses";
const ALL_WAREHOUSES = "all_warehouses";
const ALL_SELLERS = "all_sellers";
const ALL_CALL_STATUSES = "all_call_statuses";
const CUSTOM_DATE_RANGE = "custom_range";

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

interface CallCenterOrderFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  warehouseFilter: string;
  setWarehouseFilter: (value: string) => void;
  sellerFilter: string;
  setSellerFilter: (value: string) => void;
  callStatusFilter: string;
  setCallStatusFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  dateFromFilter: string;
  setDateFromFilter: (value: string) => void;
  dateToFilter: string;
  setDateToFilter: (value: string) => void;
  showDoubleOnly: boolean;
  setShowDoubleOnly: (value: boolean) => void;
  allWarehouses: WarehouseOption[];
  allSellers: SellerOption[];
  isAdminOrModerator: boolean;
}

export function CallCenterOrderFilters({
  statusFilter,
  setStatusFilter,
  warehouseFilter,
  setWarehouseFilter,
  sellerFilter,
  setSellerFilter,
  callStatusFilter,
  setCallStatusFilter,
  priorityFilter,
  setPriorityFilter,
  dateFromFilter,
  setDateFromFilter,
  dateToFilter,
  setDateToFilter,
  showDoubleOnly,
  setShowDoubleOnly,
  allWarehouses,
  allSellers,
  isAdminOrModerator,
}: CallCenterOrderFiltersProps) {
  const t = useTranslations();

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.PENDING]: {
        label: t("orders.statuses.pending"),
      },
      [OrderStatus.CONFIRMED]: {
        label: t("orders.statuses.confirmed"),
      },
      [OrderStatus.CANCELLED]: {
        label: t("orders.statuses.cancelled"),
      },
      [OrderStatus.WRONG_NUMBER]: {
        label: t("orders.statuses.wrong_number"),
      },
      [OrderStatus.DOUBLE]: {
        label: t("orders.statuses.double"),
      },
      [OrderStatus.UNREACHED]: {
        label: t("orders.statuses.unreached"),
      },
      [OrderStatus.EXPIRED]: {
        label: t("orders.statuses.expired"),
      },
    };

    return statusConfig[status] || { label: "Unknown" };
  };

  const handleDateRangePreset = (preset: string) => {
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

  return (
    <div className="py-8 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Priority Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium leading-tight">
          {t("callCenter.priority.urgent")} / {t("callCenter.priority.high")} / {t("callCenter.priority.normal")}
        </h3>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_priorities">All Priorities</SelectItem>
            <SelectItem value="urgent">{t("callCenter.priority.urgent")}</SelectItem>
            <SelectItem value="high">{t("callCenter.priority.high")}</SelectItem>
            <SelectItem value="normal">{t("callCenter.priority.normal")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium leading-tight">
          {t("orders.filters.filterByStatus")}
        </h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("orders.filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>
              {t("orders.filters.allStatuses")}
            </SelectItem>
            {Object.values(OrderStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {getStatusBadge(status).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Call Status Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium leading-tight">
          {t("orders.filters.filterByCallStatus")}
        </h3>
        <Select value={callStatusFilter} onValueChange={setCallStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("orders.filters.allCallStatuses")} />
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

      {/* Warehouse Filter */}
      {allWarehouses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium leading-tight">
            {t("orders.filters.filterByWarehouse")}
          </h3>
          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("orders.filters.allWarehouses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_WAREHOUSES}>
                {t("orders.filters.allWarehouses")}
              </SelectItem>
              {allWarehouses.map((warehouse) => (
                <SelectItem key={warehouse._id} value={warehouse._id}>
                  {warehouse.name} ({warehouse.country})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Seller Filter (Admin/Moderator only) */}
      {isAdminOrModerator && allSellers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium leading-tight">
            {t("orders.filters.filterBySeller")}
          </h3>
          <Select value={sellerFilter} onValueChange={setSellerFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("orders.filters.allSellers")} />
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

      {/* Date Range Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium leading-tight">
          {t("orders.filters.filterByDate")}
        </h3>
        <div className="space-y-3">
          <Select onValueChange={handleDateRangePreset}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("orders.filters.dateRange")} />
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
  );
}
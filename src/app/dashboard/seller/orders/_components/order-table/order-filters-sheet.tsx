"use client";

import { Filter, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { OrderStatus } from "@/lib/db/models/order";
import {
  ALL_STATUSES,
  ALL_SELLERS,
  ALL_CALL_STATUSES,
  CUSTOM_DATE_RANGE,
  SellerOption,
} from "./order-table-types";

interface OrderFiltersSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sellerFilter: string;
  onSellerFilterChange: (value: string) => void;
  callStatusFilter: string;
  onCallStatusFilterChange: (value: string) => void;
  dateFromFilter: string;
  onDateFromFilterChange: (value: string) => void;
  dateToFilter: string;
  onDateToFilterChange: (value: string) => void;
  showDoubleOnly: boolean;
  onShowDoubleOnlyChange: (value: boolean) => void;
  phaseFilter?: 'confirmation' | 'shipping';
  onPhaseFilterChange: (value: 'confirmation' | 'shipping' | undefined) => void;
  dateRangePreset: string;
  onDateRangePresetChange: (value: string) => void;
  allSellers: SellerOption[];
  isAdminOrModerator: boolean;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export default function OrderFiltersSheet({
  isOpen,
  onOpenChange,
  statusFilter,
  onStatusFilterChange,
  sellerFilter,
  onSellerFilterChange,
  callStatusFilter,
  onCallStatusFilterChange,
  dateFromFilter,
  onDateFromFilterChange,
  dateToFilter,
  onDateToFilterChange,
  showDoubleOnly,
  onShowDoubleOnlyChange,
  phaseFilter,
  onPhaseFilterChange,
  dateRangePreset,
  onDateRangePresetChange,
  allSellers,
  isAdminOrModerator,
  onApplyFilters,
  onClearFilters,
}: OrderFiltersSheetProps) {
  const t = useTranslations();

  // Get status badge styling
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
      [OrderStatus.SHIPPED]: {
        label: t("orders.statuses.shipped"),
      },
      [OrderStatus.ASSIGNED_TO_DELIVERY]: {
        label: t("orders.statuses.assigned_to_delivery"),
      },
      [OrderStatus.ACCEPTED_BY_DELIVERY]: {
        label: t("orders.statuses.accepted_by_delivery"),
      },
      [OrderStatus.IN_TRANSIT]: {
        label: t("orders.statuses.in_transit"),
      },
      [OrderStatus.OUT_FOR_DELIVERY]: {
        label: t("orders.statuses.out_for_delivery"),
      },
      [OrderStatus.DELIVERED]: {
        label: t("orders.statuses.delivered"),
      },
      [OrderStatus.DELIVERY_FAILED]: {
        label: t("orders.statuses.delivery_failed"),
      },
      [OrderStatus.REFUNDED]: {
        label: t("orders.statuses.refunded"),
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
      [OrderStatus.CANCELLED_AT_DELIVERY]: {
        label: t("orders.statuses.cancelled_at_delivery"),
      },
      [OrderStatus.BUSY]: {
        label: t("orders.statuses.busy"),
      },
      [OrderStatus.UNREACHABLE]: {
        label: t("orders.statuses.unreachable"),
      },
      [OrderStatus.NO_ANSWER]: {
        label: t("orders.statuses.no_answer"),
      },
      [OrderStatus.ASKING_FOR_DISCOUNT]: {
        label: t("orders.statuses.asking_for_discount"),
      },
      [OrderStatus.NOT_READY]: {
        label: t("orders.statuses.not_ready"),
      },
      [OrderStatus.MISTAKEN_ORDER]: {
        label: t("orders.statuses.mistaken_order"),
      },
      [OrderStatus.OUT_OF_DELIVERY_ZONE]: {
        label: t("orders.statuses.out_of_delivery_zone"),
      },
      [OrderStatus.IN_PREPARATION]: {
        label: t("orders.statuses.in_preparation"),
      },
      [OrderStatus.AWAITING_DISPATCH]: {
        label: t("orders.statuses.awaiting_dispatch"),
      },
      [OrderStatus.PAID]: {
        label: t("orders.statuses.paid"),
      },
      [OrderStatus.ALREADY_RECEIVED]: {
        label: t("orders.statuses.already_received"),
      },
      [OrderStatus.RETURN_IN_PROGRESS]: {
        label: t("orders.statuses.return_in_progress"),
      },
      [OrderStatus.RETURNED]: {
        label: t("orders.statuses.returned"),
      },
      [OrderStatus.PROCESSED]: {
        label: t("orders.statuses.processed"),
      },
      [OrderStatus.REFUND_IN_PROGRESS]: {
        label: t("orders.statuses.refund_in_progress"),
      },
    };

    return (
      statusConfig[status] || {
        label: t("common.unknown"),
      }
    );
  };

  // Handle phase toggle - only one can be active at a time
  const handlePhaseToggle = (phase: 'confirmation' | 'shipping') => {
    if (phaseFilter === phase) {
      // If clicking the same phase that's already active, turn it off
      onPhaseFilterChange(undefined);
    } else {
      // Otherwise, set the new phase
      onPhaseFilterChange(phase);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("orders.filters.allStatuses")} />
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

          {/* Phase Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium leading-tight">
              {t("orders.phaseFilter.title")}
            </h3>
            <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="confirmation-phase"
                  className="cursor-pointer font-medium"
                >
                  {t("orders.phaseFilter.confirmationPhase")}
                </Label>
                <Switch
                  id="confirmation-phase"
                  checked={phaseFilter === 'confirmation'}
                  onCheckedChange={() => handlePhaseToggle('confirmation')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label
                  htmlFor="shipping-phase"
                  className="cursor-pointer font-medium"
                >
                  {t("orders.phaseFilter.shippingPhase")}
                </Label>
                <Switch
                  id="shipping-phase"
                  checked={phaseFilter === 'shipping'}
                  onCheckedChange={() => handlePhaseToggle('shipping')}
                />
              </div>

              {phaseFilter && (
                <p className="text-xs text-muted-foreground mt-2">
                  {phaseFilter === 'confirmation'
                    ? t("orders.phaseFilter.confirmationDescription")
                    : t("orders.phaseFilter.shippingDescription")
                  }
                </p>
              )}
            </div>
          </div>

          {/* Seller Filter (Admin/Moderator only) */}
          {isAdminOrModerator && allSellers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium leading-tight">
                {t("orders.filters.filterBySeller")}
              </h3>
              <Select value={sellerFilter} onValueChange={onSellerFilterChange}>
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

          {/* Call Status Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium leading-tight">
              {t("orders.filters.filterByCallStatus")}
            </h3>
            <Select value={callStatusFilter} onValueChange={onCallStatusFilterChange}>
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
                <SelectItem value="busy">{t("orders.callStatuses.busy")}</SelectItem>
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
              <Select value={dateRangePreset} onValueChange={onDateRangePresetChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("orders.filters.dateRange")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CUSTOM_DATE_RANGE}>
                    {t("orders.filters.customRange")}
                  </SelectItem>
                  <SelectItem value="today">{t("orders.filters.today")}</SelectItem>
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
                    onChange={(e) => onDateFromFilterChange(e.target.value)}
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
                    onChange={(e) => onDateToFilterChange(e.target.value)}
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
                onCheckedChange={onShowDoubleOnlyChange}
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
              <Button onClick={onApplyFilters}>{t("orders.applyFilters")}</Button>
            </SheetClose>
            <Button
              type="button"
              variant="outline"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <FilterX className="h-4 w-4" />
              {t("orders.clearFilters")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
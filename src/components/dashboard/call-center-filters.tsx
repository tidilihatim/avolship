'use client';

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, Package, Clock } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { CallCenterFilters, DateRangeFilter } from "@/app/actions/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  _id: string;
  name: string;
  code: string;
}

interface CallCenterFiltersProps {
  products: Product[];
  isLoadingProducts?: boolean;
  filters: CallCenterFilters;
  onFiltersChange: (filters: CallCenterFilters) => void;
}

const datePresets = [
  { value: 'today', label: 'Today', icon: Clock },
  { value: 'yesterday', label: 'Yesterday', icon: Clock },
  { value: 'this_week', label: 'This Week', icon: Clock },
  { value: 'this_month', label: 'This Month', icon: Clock },
  { value: 'this_year', label: 'This Year', icon: Clock },
  { value: 'custom', label: 'Custom Range', icon: CalendarIcon },
];

const FiltersSkeleton = () => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-9 w-48" />
    <Skeleton className="h-9 w-32" />
    <Skeleton className="h-9 w-40" />
  </div>
);

export const CallCenterFiltersComponent = ({ 
  products, 
  isLoadingProducts, 
  filters, 
  onFiltersChange 
}: CallCenterFiltersProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  if (isLoadingProducts) {
    return <FiltersSkeleton />;
  }

  const handleProductChange = (productId: string) => {
    onFiltersChange({
      ...filters,
      productId: productId === 'all' ? undefined : productId,
    });
  };

  const handleDatePresetChange = (preset: string) => {
    const dateRangeFilter: DateRangeFilter = {
      preset: preset === 'custom' ? undefined : preset as any,
    };

    if (preset === 'custom' && dateRange?.from && dateRange?.to) {
      dateRangeFilter.from = dateRange.from;
      dateRangeFilter.to = dateRange.to;
      dateRangeFilter.preset = 'custom';
    }

    onFiltersChange({
      ...filters,
      dateRange: dateRangeFilter,
    });
  };

  const handleCustomDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          preset: 'custom',
          from: range.from,
          to: range.to,
        },
      });
    }
  };

  const selectedProduct = products.find(p => p._id === filters.productId);
  const selectedPreset = datePresets.find(p => p.value === filters.dateRange.preset);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filters:
      </div>

      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.productId || 'all'}
          onValueChange={handleProductChange}
        >
          <SelectTrigger className="w-auto min-w-[200px] h-9">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((product) => (
              <SelectItem key={product._id} value={product._id}>
                {product.name} ({product.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.dateRange.preset || 'this_month'}
          onValueChange={handleDatePresetChange}
        >
          <SelectTrigger className="w-auto min-w-[140px] h-9">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {datePresets.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.dateRange.preset === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                  </>
                ) : (
                  format(dateRange.from, "MMM dd")
                )
              ) : (
                "Custom range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleCustomDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Active Filters Display */}
      <div className="flex items-center gap-2 ml-auto">
        {selectedProduct && (
          <Badge variant="secondary" className="h-7">
            {selectedProduct.name}
          </Badge>
        )}
        {selectedPreset && (
          <Badge variant="secondary" className="h-7">
            {selectedPreset.label}
          </Badge>
        )}
        {filters.dateRange.preset === 'custom' && dateRange?.from && dateRange?.to && (
          <Badge variant="secondary" className="h-7">
            {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
          </Badge>
        )}
      </div>
    </div>
  );
};
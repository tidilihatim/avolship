'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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

interface DashboardFiltersProps {
  products: Product[];
  isLoadingProducts?: boolean;
  filters: CallCenterFilters;
  onFiltersChange: (filters: CallCenterFilters) => void;
}

const datePresets = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const FiltersSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-24" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DashboardFilters = ({ 
  products, 
  isLoadingProducts, 
  filters, 
  onFiltersChange 
}: DashboardFiltersProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Product</label>
            <Select
              value={filters.productId || 'all'}
              onValueChange={handleProductChange}
            >
              <SelectTrigger>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select
              value={filters.dateRange.preset || 'this_month'}
              onValueChange={handleDatePresetChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
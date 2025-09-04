'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Filter, RotateCcw, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DashboardFilters {
  dateRange: {
    from?: Date;
    to?: Date;
    preset?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';
  };
  userRole?: string;
  orderStatus?: string;
  warehouseId?: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  warehouses?: Array<{ _id: string; name: string; }>;
  loading?: boolean;
}

const datePresets = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

const userRoles = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SELLER', label: 'Seller' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'PROVIDER', label: 'Provider' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'CALL_CENTER', label: 'Call Center' },
  { value: 'MODERATOR', label: 'Moderator' }
];

const orderStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' }
];

export function DashboardFilters({ 
  filters, 
  onFiltersChange, 
  warehouses = [],
  loading = false
}: DashboardFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
    setHasChanges(false);
  }, [filters]);

  const updateLocalFilters = (updates: Partial<DashboardFilters>) => {
    const newFilters = { ...localFilters, ...updates };
    setLocalFilters(newFilters);
    
    // Check if there are changes
    const hasActualChanges = JSON.stringify(newFilters) !== JSON.stringify(filters);
    setHasChanges(hasActualChanges);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setHasChanges(false);
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateRange: { preset: 'this_month' as const },
      userRole: undefined,
      orderStatus: undefined,
      warehouseId: undefined
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    setHasChanges(false);
  };

  const handleDatePresetChange = (preset: string) => {
    if (preset === 'custom') {
      updateLocalFilters({
        dateRange: { preset: preset as any, from: undefined, to: undefined }
      });
    } else {
      updateLocalFilters({
        dateRange: { preset: preset as any }
      });
    }
  };

  const handleDateRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from || range?.to) {
      updateLocalFilters({
        dateRange: {
          preset: 'custom',
          from: range?.from,
          to: range?.to
        }
      });
      setIsCalendarOpen(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.userRole) count++;
    if (localFilters.orderStatus) count++;
    if (localFilters.warehouseId) count++;
    if (localFilters.dateRange.preset !== 'this_month') count++;
    return count;
  };

  const formatDateRange = () => {
    if (localFilters.dateRange.preset && localFilters.dateRange.preset !== 'custom') {
      return datePresets.find(p => p.value === localFilters.dateRange.preset)?.label || 'This Month';
    }
    
    if (localFilters.dateRange.from && localFilters.dateRange.to) {
      return `${format(localFilters.dateRange.from, 'MMM dd')} - ${format(localFilters.dateRange.to, 'MMM dd')}`;
    }
    
    if (localFilters.dateRange.from) {
      return `From ${format(localFilters.dateRange.from, 'MMM dd, yyyy')}`;
    }
    
    return 'This Month';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Dashboard Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} active
              </Badge>
            )}
            {hasChanges && (
              <Badge variant="destructive" className="animate-pulse">
                Pending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-8"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={applyFilters}
              size="sm"
              className="h-8"
              disabled={!hasChanges || loading}
            >
              {loading ? (
                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Search className="h-4 w-4 mr-1" />
              )}
              Apply Filters
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex gap-2">
              <Select
                value={localFilters.dateRange.preset || 'this_month'}
                onValueChange={handleDatePresetChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {datePresets.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {localFilters.dateRange.preset === 'custom' && (
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !localFilters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateRange()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={localFilters.dateRange.from}
                      selected={{
                        from: localFilters.dateRange.from,
                        to: localFilters.dateRange.to
                      }}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {/* User Role Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">User Role</label>
            <Select
              value={localFilters.userRole || 'all'}
              onValueChange={(value) => updateLocalFilters({ 
                userRole: value === 'all' ? undefined : value 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {userRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Order Status</label>
            <Select
              value={localFilters.orderStatus || 'all'}
              onValueChange={(value) => updateLocalFilters({ 
                orderStatus: value === 'all' ? undefined : value 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {orderStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warehouse Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Warehouse</label>
            <Select
              value={localFilters.warehouseId || 'all'}
              onValueChange={(value) => updateLocalFilters({ 
                warehouseId: value === 'all' ? undefined : value 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All warehouses</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
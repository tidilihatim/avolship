'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Search, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { WebhookLogsFilters as Filters } from '@/app/actions/webhook-logs';
import { WebhookStatus } from '@/lib/db/models/webhook-log';

interface WebhookLogsFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  loading?: boolean;
}

export function WebhookLogsFilters({ filters, onFiltersChange, loading }: WebhookLogsFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  );

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  const handleApplyFilters = () => {
    const newFilters: Filters = {
      ...localFilters,
      dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
      dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
    };
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: Filters = {};
    setLocalFilters(emptyFilters);
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange(emptyFilters);
  };

  const formatStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search and Filter Toggle */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by webhook ID, order ID, customer name, or error message..."
                value={localFilters.search || ''}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {Object.values(filters).filter(v => v !== undefined && v !== '').length}
                </span>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={localFilters.status || ''}
                    onValueChange={(value) => setLocalFilters(prev => ({ 
                      ...prev, 
                      status: value === 'all' ? undefined : value as WebhookStatus 
                    }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Object.values(WebhookStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatStatusDisplay(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select
                    value={localFilters.platform || ''}
                    onValueChange={(value) => setLocalFilters(prev => ({ 
                      ...prev, 
                      platform: value === 'all' ? undefined : value 
                    }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All platforms</SelectItem>
                      <SelectItem value="youcan">YouCan</SelectItem>
                      <SelectItem value="shopify">Shopify</SelectItem>
                      <SelectItem value="woocommerce">WooCommerce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={loading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={loading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={loading || !hasActiveFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  disabled={loading}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          {/* Quick Apply for Search */}
          {localFilters.search !== filters.search && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                Search
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
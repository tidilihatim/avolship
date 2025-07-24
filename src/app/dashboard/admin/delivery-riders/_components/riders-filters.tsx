'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { RidersFilters } from '../_hooks/useDeliveryRiders';

interface RidersFiltersProps {
  filters: RidersFilters;
  onFiltersChange: (filters: Partial<RidersFilters>) => void;
  totalRiders: number;
  onlineCount: number;
  availableCount: number;
}

export const RidersFiltersComponent: React.FC<RidersFiltersProps> = ({
  filters,
  onFiltersChange,
  totalRiders,
  onlineCount,
  availableCount
}) => {
  const hasActiveFilters = filters.status !== 'all' || filters.availability !== 'all' || filters.search.length > 0;

  const clearFilters = () => {
    onFiltersChange({ status: 'all', availability: 'all', search: '' });
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search riders by name or email..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value: 'all' | 'online' | 'offline') => 
            onFiltersChange({ status: value })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online Only</SelectItem>
            <SelectItem value="offline">Offline Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Availability Filter */}
        <Select
          value={filters.availability}
          onValueChange={(value: 'all' | 'available' | 'busy') => 
            onFiltersChange({ availability: value })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Availability</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="default"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Active Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <button
                onClick={() => onFiltersChange({ status: 'all' })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.availability !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.availability === 'available' ? 'Available' : 'Busy'}
              <button
                onClick={() => onFiltersChange({ availability: 'all' })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{filters.search}"
              <button
                onClick={() => onFiltersChange({ search: '' })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{totalRiders} total</span>
          <span className="text-primary">{onlineCount} online</span>
          <span className="text-primary">{availableCount} available</span>
        </div>
      </div>
    </div>
  );
};
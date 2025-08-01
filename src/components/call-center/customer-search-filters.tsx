'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, Filter, Calendar, SortAsc, SortDesc, X } from 'lucide-react'
import { format } from 'date-fns'

interface CustomerSearchFiltersProps {
  defaultSearch?: string
  defaultStatus?: string
  defaultSortBy?: string
  defaultSortOrder?: string
}

export const CustomerSearchFilters: React.FC<CustomerSearchFiltersProps> = ({
  defaultSearch = '',
  defaultStatus = 'all',
  defaultSortBy = 'lastContact',
  defaultSortOrder = 'desc'
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(defaultSearch)
  const [status, setStatus] = useState(defaultStatus)
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [sortBy, setSortBy] = useState(defaultSortBy)
  const [sortOrder, setSortOrder] = useState(defaultSortOrder)
  const [showFilters, setShowFilters] = useState(false)

  const applyFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      
      // Update search params
      if (search.trim()) {
        params.set('search', search.trim())
      } else {
        params.delete('search')
      }
      
      if (status !== 'all') {
        params.set('status', status)
      } else {
        params.delete('status')
      }
      
      if (dateFrom) {
        params.set('dateFrom', dateFrom.toISOString())
      } else {
        params.delete('dateFrom')
      }
      
      if (dateTo) {
        params.set('dateTo', dateTo.toISOString())
      } else {
        params.delete('dateTo')
      }
      
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      
      // Reset to page 1 when filters change
      params.set('page', '1')
      
      router.push(`/dashboard/call_center/customers?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setDateFrom(undefined)
    setDateTo(undefined)
    setSortBy('lastContact')
    setSortOrder('desc')
    
    startTransition(() => {
      router.push('/dashboard/call_center/customers')
    })
  }

  const hasActiveFilters = search.trim() || status !== 'all' || dateFrom || dateTo

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Primary Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, phone, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <Button onClick={applyFilters} disabled={isPending}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="px-3"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="unreached">Unreached</SelectItem>
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
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      disabled={(date) => date > new Date() || (dateTo ? date > dateTo : false)}
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
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      disabled={(date) => date > new Date() || (dateFrom ? date < dateFrom : false)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="lastContact">Last Contact</SelectItem>
                      <SelectItem value="orders">Order Count</SelectItem>
                      <SelectItem value="totalValue">Total Value</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    {sortOrder === 'asc' ? (
                      <SortAsc className="w-4 h-4" />
                    ) : (
                      <SortDesc className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={applyFilters} disabled={isPending}>
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
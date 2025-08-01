import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getCustomers, CustomerFilters, PaginationParams } from '@/app/actions/customers'
import { CustomerSearchFilters } from '@/components/call-center/customer-search-filters'
import { CustomerList } from '@/components/call-center/customer-list'
import { Pagination } from '@/components/call-center/pagination'

interface SearchParams {
  search?: string
  status?: 'all' | 'active' | 'pending' | 'unreached' | 'confirmed'
  dateFrom?: string
  dateTo?: string
  sortBy?: 'name' | 'lastContact' | 'orders' | 'totalValue'
  sortOrder?: 'asc' | 'desc'
  page?: string
  limit?: string
}

const CallCenterCustomers = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  
  // Await search parameters (Next.js 15 requirement)
  const params = await searchParams
  
  // Parse search parameters
  const filters: CustomerFilters = {
    search: params.search || '',
    status: params.status || 'all',
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sortBy: params.sortBy || 'lastContact',
    sortOrder: params.sortOrder || 'desc'
  }
  
  const pagination: PaginationParams = {
    page: parseInt(params.page || '1'),
    limit: parseInt(params.limit || '10')
  }
  
  // Fetch customers data
  const customersResult = await getCustomers(filters, pagination)
  
  if (!customersResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/call-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Customer Database</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer information and call history
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Error Loading Customers</h3>
            <p className="text-muted-foreground">
              {customersResult.message || 'Failed to load customer data'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const { customers, pagination: paginationData } = customersResult.data!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/call-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Customer Database</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer information and call history
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold">{paginationData.totalCount}</div>
          <div className="text-sm text-muted-foreground">Total Customers</div>
        </div>
      </div>

      {/* Search and Filters */}
      <CustomerSearchFilters 
        defaultSearch={filters.search}
        defaultStatus={filters.status}
        defaultSortBy={filters.sortBy}
        defaultSortOrder={filters.sortOrder}
      />

      {/* Customer List */}
      <CustomerList customers={customers} />
      
      {/* Pagination */}
      {paginationData.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <Pagination 
              currentPage={paginationData.currentPage}
              totalPages={paginationData.totalPages}
              totalCount={paginationData.totalCount}
              hasNextPage={paginationData.hasNextPage}
              hasPrevPage={paginationData.hasPrevPage}
              pageSize={pagination.limit || 10}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CallCenterCustomers
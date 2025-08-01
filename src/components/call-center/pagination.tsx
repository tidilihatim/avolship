'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  pageSize?: number
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  hasNextPage,
  hasPrevPage,
  pageSize = 10
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  const changePageSize = (newSize: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('limit', newSize)
    params.set('page', '1') // Reset to first page when changing page size
    router.push(`?${params.toString()}`)
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > delta + 2) {
        pages.push('...')
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - delta)
      const end = Math.min(totalPages - 1, currentPage + delta)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - delta - 1) {
        pages.push('...')
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {totalCount} result{totalCount !== 1 ? 's' : ''}
        </div>
      </div>
    )
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
      {/* Results Info */}
      <div className="text-muted-foreground">
        Showing {startItem}-{endItem} of {totalCount} results
      </div>

      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Show:</span>
        <Select value={pageSize.toString()} onValueChange={changePageSize}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">per page</span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(1)}
          disabled={!hasPrevPage}
          className="hidden sm:flex"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-1 text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => navigateToPage(page as number)}
                  className="min-w-[36px]"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={!hasNextPage}
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(totalPages)}
          disabled={!hasNextPage}
          className="hidden sm:flex"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
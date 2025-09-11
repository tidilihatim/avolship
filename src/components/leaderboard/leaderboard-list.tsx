'use client'

import { useState } from 'react'
import { LeaderboardEntry, PaginatedLeaderboard, LeaderboardPeriod } from "@/app/actions/leaderboard"
import { LeaderboardEntryComponent } from './leaderboard-entry'
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'

interface LeaderboardListProps {
  data: PaginatedLeaderboard
  loading?: boolean
  error?: string
  onPageChange: (page: number) => void
  onRefresh: () => void
  compact?: boolean
  showAdditionalInfo?: boolean
}

export function LeaderboardList({
  data,
  loading = false,
  error,
  onPageChange,
  onRefresh,
  compact = false,
  showAdditionalInfo = true
}: LeaderboardListProps) {
  const t = useTranslations('leaderboard.common');
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('retry')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!data.entries.length) {
    return (
      <Alert>
        <AlertDescription className="text-center py-8">
          {t('noEntriesFound')}
        </AlertDescription>
      </Alert>
    )
  }

  const generatePaginationItems = () => {
    const items = []
    const currentPage = data.currentPage
    const totalPages = data.totalPages
    
    // Always show first page
    if (currentPage > 3) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => onPageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      )
      
      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
    }
    
    // Show pages around current page
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    
    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => onPageChange(i)} 
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
      
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => onPageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    return items
  }

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {t('showingParticipants', { count: data.entries.length, total: data.totalCount })}
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          {t('refresh')}
        </Button>
      </div>

      {/* Leaderboard Entries */}
      <div className="space-y-2">
        {data.entries.map((entry) => (
          <LeaderboardEntryComponent
            key={entry.id}
            entry={entry}
            showAdditionalInfo={showAdditionalInfo}
            compact={compact}
          />
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange(Math.max(1, data.currentPage - 1))}
                  className={cn(!data.hasPreviousPage && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              
              {generatePaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => onPageChange(Math.min(data.totalPages, data.currentPage + 1))}
                  className={cn(!data.hasNextPage && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
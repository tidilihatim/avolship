'use client'

import { useState, useEffect, useTransition } from 'react'
import { LeaderboardPeriod, PaginatedLeaderboard } from "@/app/actions/leaderboard"
import { LeaderboardHeader } from './leaderboard-header'
import { LeaderboardList } from './leaderboard-list'
import { toast } from "sonner"

interface LeaderboardContainerProps {
  title: string
  description: string
  icon?: React.ReactNode
  fetchLeaderboard: (period: LeaderboardPeriod, page: number) => Promise<PaginatedLeaderboard>
  getCurrentUserPosition?: (period: LeaderboardPeriod) => Promise<{ rank: number; score: number; totalParticipants: number } | null>
  initialPeriod?: LeaderboardPeriod
  compact?: boolean
  showAdditionalInfo?: boolean
}

export function LeaderboardContainer({
  title,
  description,
  icon,
  fetchLeaderboard,
  getCurrentUserPosition,
  initialPeriod = 'monthly',
  compact = false,
  showAdditionalInfo = true
}: LeaderboardContainerProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod)
  const [currentPage, setCurrentPage] = useState(1)
  const [data, setData] = useState<PaginatedLeaderboard | null>(null)
  const [userPosition, setUserPosition] = useState<{
    rank: number
    score: number
    totalParticipants: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadData = async (newPeriod: LeaderboardPeriod = period, page: number = 1) => {
    try {
      setError(null)
      
      const [leaderboardData, positionData] = await Promise.all([
        fetchLeaderboard(newPeriod, page),
        getCurrentUserPosition ? getCurrentUserPosition(newPeriod) : Promise.resolve(null)
      ])
      
      setData(leaderboardData)
      setUserPosition(positionData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load leaderboard'
      setError(message)
      toast.error(message)
    }
  }

  const handlePeriodChange = (newPeriod: LeaderboardPeriod) => {
    setPeriod(newPeriod)
    setCurrentPage(1)
    startTransition(() => {
      loadData(newPeriod, 1)
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    startTransition(() => {
      loadData(period, page)
    })
  }

  const handleRefresh = () => {
    startTransition(() => {
      loadData(period, currentPage)
    })
  }

  // Initial load
  useEffect(() => {
    startTransition(() => {
      loadData()
    })
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPending) {
        loadData(period, currentPage)
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [period, currentPage, isPending])

  return (
    <div className="space-y-6">
      <LeaderboardHeader
        title={title}
        description={description}
        period={period}
        onPeriodChange={handlePeriodChange}
        totalParticipants={data?.totalCount || 0}
        userRank={userPosition?.rank}
        userScore={userPosition?.score}
        icon={icon}
      />

      <LeaderboardList
        data={data || {
          entries: [],
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 0,
          currentPage: 1
        }}
        loading={isPending}
        error={error || undefined}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
        compact={compact}
        showAdditionalInfo={showAdditionalInfo}
      />
    </div>
  )
}
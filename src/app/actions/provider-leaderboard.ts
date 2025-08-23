'use server'

import { getProviderLeaderboard, getCurrentUserLeaderboardPosition, LeaderboardPeriod, PaginatedLeaderboard } from './leaderboard'

export async function fetchProviderLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLeaderboard> {
  return await getProviderLeaderboard(period, page, limit)
}

export async function getProviderUserPosition(period: LeaderboardPeriod = 'monthly') {
  return await getCurrentUserLeaderboardPosition('provider', period)
}
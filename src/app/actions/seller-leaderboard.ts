'use server'

import { getSellerLeaderboard, getCurrentUserLeaderboardPosition, LeaderboardPeriod, PaginatedLeaderboard } from './leaderboard'

export async function fetchSellerLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLeaderboard> {
  return await getSellerLeaderboard(period, page, limit)
}

export async function getSellerUserPosition(period: LeaderboardPeriod = 'monthly') {
  return await getCurrentUserLeaderboardPosition('seller', period)
}

// For sellers viewing provider leaderboards  
export async function fetchProviderLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLeaderboard> {
  const { getProviderLeaderboard } = await import('./leaderboard')
  return await getProviderLeaderboard(period, page, limit)
}
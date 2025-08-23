'use server'

import { getDeliveryLeaderboard, getCurrentUserLeaderboardPosition, LeaderboardPeriod, PaginatedLeaderboard } from './leaderboard'

export async function fetchDeliveryLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLeaderboard> {
  return await getDeliveryLeaderboard(period, page, limit)
}

export async function getDeliveryUserPosition(period: LeaderboardPeriod = 'monthly') {
  return await getCurrentUserLeaderboardPosition('delivery', period)
}
'use server'

import { getCallCenterLeaderboard, getCurrentUserLeaderboardPosition, LeaderboardPeriod, PaginatedLeaderboard } from './leaderboard'

export async function fetchCallCenterLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLeaderboard> {
  return await getCallCenterLeaderboard(period, page, limit)
}

export async function getCallCenterUserPosition(period: LeaderboardPeriod = 'monthly') {
  return await getCurrentUserLeaderboardPosition('call_center', period)
}
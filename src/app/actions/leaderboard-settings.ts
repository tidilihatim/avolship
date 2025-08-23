'use server'

import AppSettings from '@/lib/db/models/app-settings'
import { connectToDatabase as dbConnect } from '@/lib/db/mongoose'

export async function getLeaderboardSettings() {
  try {
    await dbConnect()
    const settings = await AppSettings.getActiveSettings()
    return {
      enableSellerLeaderboard: settings.leaderboardSettings?.enableSellerLeaderboard ?? true,
      enableProviderLeaderboard: settings.leaderboardSettings?.enableProviderLeaderboard ?? true,
      enableDeliveryLeaderboard: settings.leaderboardSettings?.enableDeliveryLeaderboard ?? true,
      enableCallCenterLeaderboard: settings.leaderboardSettings?.enableCallCenterLeaderboard ?? true,
    }
  } catch (error) {
    console.error('Error fetching leaderboard settings:', error)
    // Return defaults if error
    return {
      enableSellerLeaderboard: true,
      enableProviderLeaderboard: true,
      enableDeliveryLeaderboard: true,
      enableCallCenterLeaderboard: true,
    }
  }
}

export async function isLeaderboardEnabled(type: 'seller' | 'provider' | 'delivery' | 'call_center'): Promise<boolean> {
  try {
    const settings = await getLeaderboardSettings()
    switch (type) {
      case 'seller':
        return settings.enableSellerLeaderboard
      case 'provider':
        return settings.enableProviderLeaderboard
      case 'delivery':
        return settings.enableDeliveryLeaderboard
      case 'call_center':
        return settings.enableCallCenterLeaderboard
      default:
        return false
    }
  } catch (error) {
    console.error('Error checking leaderboard status:', error)
    return false
  }
}
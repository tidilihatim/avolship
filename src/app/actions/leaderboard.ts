'use server'

import { redirect } from 'next/navigation'
import { UserRole } from '@/lib/db/models/user'
import Expedition from '@/lib/db/models/expedition'
import DeliveryStats from '@/lib/db/models/delivery-stats'
import {getServerSession as auth} from "next-auth"
import Order from '@/lib/db/models/order'
import {connectToDatabase as dbConnect} from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { startOfMonth, startOfWeek, startOfYear, endOfMonth, endOfWeek, endOfYear } from 'date-fns'
import { authOptions } from '@/config/auth'

export type LeaderboardPeriod = 'monthly' | 'weekly' | 'yearly'

export interface LeaderboardEntry {
  id: string
  name: string
  businessName?: string
  email?: string
  avatar?: string
  rank: number
  score: number
  previousRank?: number
  change?: 'up' | 'down' | 'same'
  additionalInfo?: Record<string, any>
}

export interface PaginatedLeaderboard {
  entries: LeaderboardEntry[]
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  totalPages: number
  currentPage: number
}

function getDateRange(period: LeaderboardPeriod) {
  const now = new Date()
  
  switch (period) {
    case 'weekly':
      return {
        start: startOfWeek(now),
        end: endOfWeek(now)
      }
    case 'yearly':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      }
    case 'monthly':
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      }
  }
}

export async function getProviderLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLeaderboard> {
  const session = await auth(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const user = await User.findById(session.user.id)
  if (!user || ![UserRole.PROVIDER, UserRole.ADMIN, UserRole.SELLER].includes(user.role)) {
    throw new Error('Unauthorized access to provider leaderboard')
  }

  await dbConnect()

  const { start, end } = getDateRange(period)
  const skip = (page - 1) * limit

  // Aggregate expeditions by provider
  const pipeline: any[] = [
    {
      $match: {
        providerId: { $exists: true },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$providerId',
        expeditionCount: { $sum: 1 },
        totalValue: { $sum: '$totalValue' },
        averageWeight: { $avg: '$weight' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $match: {
        'user.role': UserRole.PROVIDER,
        'user.status': 'approved'
      }
    },
    {
      $sort: { expeditionCount: -1 }
    },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    }
  ]

  const result = await Expedition.aggregate(pipeline)
  const data = result[0].data || []
  const totalCount = result[0].totalCount[0]?.count || 0

  const entries: LeaderboardEntry[] = data.map((item: any, index: number) => ({
    id: item.user._id.toString(),
    name: item.user.name,
    businessName: item.user.businessName,
    rank: skip + index + 1,
    score: item.expeditionCount,
    additionalInfo: {
      totalValue: item.totalValue || 0,
      averageWeight: Math.round((item.averageWeight || 0) * 100) / 100,
      serviceType: item.user.serviceType
    }
  }))

  return {
    entries,
    totalCount,
    hasNextPage: page * limit < totalCount,
    hasPreviousPage: page > 1,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page
  }
}

export async function getDeliveryLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLeaderboard> {
  const session = await auth(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const user = await User.findById(session.user.id)
  if (!user || ![UserRole.DELIVERY, UserRole.ADMIN].includes(user.role)) {
    throw new Error('Unauthorized access to delivery leaderboard')
  }

  await dbConnect()

  const { start, end } = getDateRange(period)
  const skip = (page - 1) * limit

  // Aggregate delivery stats for the period
  const pipeline: any[] = [
    {
      $match: {
        'deliveryHistory.deliveryDate': { $gte: start, $lte: end }
      }
    },
    {
      $unwind: '$deliveryHistory'
    },
    {
      $match: {
        'deliveryHistory.deliveryDate': { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$deliveryGuyId',
        deliveryCount: { $sum: 1 },
        totalEarnings: { $sum: { $add: ['$deliveryHistory.deliveryFee', '$deliveryHistory.commission'] } },
        totalDistance: { $sum: '$deliveryHistory.distance' },
        averageDistance: { $avg: '$deliveryHistory.distance' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $match: {
        'user.role': UserRole.DELIVERY,
        'user.status': 'approved'
      }
    },
    {
      $sort: { deliveryCount: -1 }
    },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    }
  ]

  const result = await DeliveryStats.aggregate(pipeline)
  const data = result[0].data || []
  const totalCount = result[0].totalCount[0]?.count || 0

  const entries: LeaderboardEntry[] = data.map((item: any, index: number) => {
    const additionalInfo: any = {
      totalDistance: Math.round((item.totalDistance || 0) * 100) / 100,
      averageDistance: Math.round((item.averageDistance || 0) * 100) / 100,
      isAvailable: item.user.isAvailableForDelivery
    }
    
    // Only show earnings to admin users
    if (user.role === UserRole.ADMIN) {
      additionalInfo.totalEarnings = Math.round((item.totalEarnings || 0) * 100) / 100
    }
    
    return {
      id: item.user._id.toString(),
      name: item.user.name,
      rank: skip + index + 1,
      score: item.deliveryCount,
      additionalInfo
    }
  })

  return {
    entries,
    totalCount,
    hasNextPage: page * limit < totalCount,
    hasPreviousPage: page > 1,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page
  }
}

export async function getCallCenterLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLeaderboard> {
  const session = await auth(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const user = await User.findById(session.user.id)
  if (!user || ![UserRole.CALL_CENTER, UserRole.ADMIN].includes(user.role)) {
    throw new Error('Unauthorized access to call center leaderboard')
  }

  await dbConnect()

  const { start, end } = getDateRange(period)
  const skip = (page - 1) * limit

  // Aggregate orders handled by call center agents
  const pipeline: any[] = [
    {
      $match: {
        assignedAgent: { $exists: true },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$assignedAgent',
        ordersHandled: { $sum: 1 },
        totalValue: { $sum: '$finalTotalPrice' },
        confirmedOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0]
          }
        },
        deliveredOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
          }
        },
        avgCallAttempts: { $avg: '$totalCallAttempts' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $match: {
        'user.role': UserRole.CALL_CENTER,
        'user.status': 'approved'
      }
    },
    {
      $addFields: {
        conversionRate: {
          $cond: [
            { $gt: ['$ordersHandled', 0] },
            { $divide: ['$confirmedOrders', '$ordersHandled'] },
            0
          ]
        }
      }
    },
    {
      $sort: { ordersHandled: -1 }
    },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    }
  ]

  const result = await Order.aggregate(pipeline)
  const data = result[0].data || []
  const totalCount = result[0].totalCount[0]?.count || 0

  const entries: LeaderboardEntry[] = data.map((item: any, index: number) => ({
    id: item.user._id.toString(),
    name: item.user.name,
    rank: skip + index + 1,
    score: item.ordersHandled,
    additionalInfo: {
      totalValue: Math.round((item.totalValue || 0) * 100) / 100,
      confirmedOrders: item.confirmedOrders || 0,
      deliveredOrders: item.deliveredOrders || 0,
      conversionRate: Math.round((item.conversionRate || 0) * 100 * 100) / 100, // percentage
      avgCallAttempts: Math.round((item.avgCallAttempts || 0) * 100) / 100
    }
  }))

  return {
    entries,
    totalCount,
    hasNextPage: page * limit < totalCount,
    hasPreviousPage: page > 1,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page
  }
}

export async function getSellerLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLeaderboard> {
  const session = await auth(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const user = await User.findById(session.user.id)
  if (!user || ![UserRole.ADMIN, UserRole.SELLER].includes(user.role)) {
    throw new Error('Unauthorized access to seller leaderboard')
  }

  await dbConnect()

  const { start, end } = getDateRange(period)
  const skip = (page - 1) * limit

  // Aggregate orders by seller
  const pipeline: any[] = [
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$sellerId',
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$finalTotalPrice' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $match: {
        'user.role': UserRole.SELLER,
        'user.status': 'approved'
      }
    },
    {
      $sort: { totalRevenue: -1 }
    },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    }
  ]

  const result = await Order.aggregate(pipeline)
  const data = result[0].data || []
  const totalCount = result[0].totalCount[0]?.count || 0

  const entries: LeaderboardEntry[] = data.map((item: any, index: number) => ({
    id: item.user._id.toString(),
    name: item.user.name,
    businessName: item.user.businessName,
    rank: skip + index + 1,
    score: item.totalRevenue,
    additionalInfo: {
      totalOrders: item.totalOrders || 0,
      country: item.user.country
    }
  }))

  return {
    entries,
    totalCount,
    hasNextPage: page * limit < totalCount,
    hasPreviousPage: page > 1,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page
  }
}

export async function getCurrentUserLeaderboardPosition(
  leaderboardType: 'provider' | 'delivery' | 'call_center' | 'seller',
  period: LeaderboardPeriod = 'monthly'
): Promise<{ rank: number; score: number; totalParticipants: number } | null> {
  const session = await auth(authOptions)
  if (!session?.user?.id) {
    return null
  }

  await dbConnect()

  const { start, end } = getDateRange(period)
  const userId = session.user.id

  switch (leaderboardType) {
    case 'provider': {
      const pipeline: any[] = [
        {
          $match: {
            providerId: { $exists: true },
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$providerId',
            expeditionCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            'user.role': UserRole.PROVIDER,
            'user.status': 'approved'
          }
        },
        {
          $sort: { expeditionCount: -1 }
        },
        {
          $group: {
            _id: null,
            users: { $push: { userId: '$_id', score: '$expeditionCount' } },
            total: { $sum: 1 }
          }
        }
      ]

      const result = await Expedition.aggregate(pipeline)
      if (!result.length) return null

      const users = result[0].users
      const userIndex = users.findIndex((u: any) => u.userId.toString() === userId)
      if (userIndex === -1) return null

      return {
        rank: userIndex + 1,
        score: users[userIndex].score,
        totalParticipants: result[0].total
      }
    }

    case 'delivery': {
      const stats = await DeliveryStats.findOne({ deliveryGuyId: userId })
      if (!stats) return null

      const pipeline: any[] = [
        {
          $match: {
            'deliveryHistory.deliveryDate': { $gte: start, $lte: end }
          }
        },
        {
          $unwind: '$deliveryHistory'
        },
        {
          $match: {
            'deliveryHistory.deliveryDate': { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$deliveryGuyId',
            deliveryCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            'user.role': UserRole.DELIVERY,
            'user.status': 'approved'
          }
        },
        {
          $sort: { deliveryCount: -1 }
        },
        {
          $group: {
            _id: null,
            users: { $push: { userId: '$_id', score: '$deliveryCount' } },
            total: { $sum: 1 }
          }
        }
      ]

      const result = await DeliveryStats.aggregate(pipeline)
      if (!result.length) return null

      const users = result[0].users
      const userIndex = users.findIndex((u: any) => u.userId.toString() === userId)
      if (userIndex === -1) return null

      return {
        rank: userIndex + 1,
        score: users[userIndex].score,
        totalParticipants: result[0].total
      }
    }

    case 'seller': {
      const pipeline: any[] = [
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$sellerId',
            totalRevenue: { $sum: '$finalTotalPrice' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            'user.role': UserRole.SELLER,
            'user.status': 'approved'
          }
        },
        {
          $sort: { totalRevenue: -1 }
        },
        {
          $group: {
            _id: null,
            users: { $push: { userId: '$_id', score: '$totalRevenue' } },
            total: { $sum: 1 }
          }
        }
      ]

      const result = await Order.aggregate(pipeline)
      if (!result.length) return null

      const users = result[0].users
      const userIndex = users.findIndex((u: any) => u.userId.toString() === userId)
      if (userIndex === -1) return null

      return {
        rank: userIndex + 1,
        score: users[userIndex].score,
        totalParticipants: result[0].total
      }
    }

    default:
      return null
  }
}
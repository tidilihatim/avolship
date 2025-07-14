import { connectToDatabase } from '@/lib/db/mongoose';
import Leaderboard, { 
  ILeaderboard, 
  LeaderboardType, 
  LeaderboardPeriod,
  ProviderMetrics,
  SellerMetrics,
  CallCenterAgentMetrics 
} from '@/lib/db/models/leaderboard';
import Order, { OrderStatus } from '@/lib/db/models/order';
import User, { UserRole } from '@/lib/db/models/user';
import ProviderRating from '@/lib/db/models/provider-rating';
import AgentRating from '@/lib/db/models/agent-rating';
import mongoose from 'mongoose';

export class LeaderboardService {
  
  static async calculateProviderMetrics(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProviderMetrics> {
    await connectToDatabase();
    
    // TODO: Need to implement proper expedition tracking
    // For now, return mock data for deliveries
    const orders: any[] = [];

    const totalDeliveries = orders.length;
    const successfulDeliveries = orders.filter(order => 
      order.status === OrderStatus.CONFIRMED
    ).length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.finalTotalPrice, 0);
    const avgOrderValue = totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0;
    
    // Calculate delivery times (mock calculation - would need actual delivery data)
    const avgDeliveryTime = 24; // hours - would calculate from actual delivery timestamps
    const onTimeDeliveryRate = totalDeliveries > 0 
      ? Math.min(95, (successfulDeliveries / totalDeliveries) * 100)
      : 0;
    const cancellationRate = totalDeliveries > 0 
      ? Math.max(0, 100 - onTimeDeliveryRate)
      : 0;
    
    // Get actual ratings from sellers
    const ratings = await ProviderRating.find({
      providerId: new mongoose.Types.ObjectId(providerId),
      status: 'ACTIVE',
      createdAt: { $gte: startDate, $lte: endDate },
    });
    
    const totalRatingCount = ratings.length;
    let customerRating = 0;
    
    if (totalRatingCount > 0) {
      const totalScore = ratings.reduce((sum, rating) => sum + rating.overallScore, 0);
      customerRating = totalScore / totalRatingCount;
    } else {
      // Default rating if no ratings yet
      customerRating = 0;
    }
    
    return {
      totalDeliveries,
      successfulDeliveries,
      avgDeliveryTime,
      customerRating,
      totalRatingCount,
      onTimeDeliveryRate,
      cancellationRate,
      revenue: totalRevenue,
      avgOrderValue,
    };
  }
  
  static async calculateSellerMetrics(
    sellerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SellerMetrics> {
    await connectToDatabase();
    
    const orders = await Order.find({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalOrders = orders.length;
    const confirmedOrders = orders.filter(order => 
      order.status === OrderStatus.CONFIRMED
    ).length;
    const deliveredOrders = orders.filter(order => 
      order.status === OrderStatus.CONFIRMED // Would need actual delivery status
    ).length;
    
    const conversionRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0;
    const totalRevenue = orders.reduce((sum, order) => sum + order.finalTotalPrice, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalOrders,
      confirmedOrders,
      deliveredOrders,
      conversionRate,
      customerRating: 0, // Sellers don't have ratings
      totalRatingCount: 0,
      revenue: totalRevenue,
      avgOrderValue,
      returnRate: Math.max(0, 5 - (conversionRate / 20)), // Mock calculation
    };
  }
  
  static async calculateCallCenterAgentMetrics(
    agentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CallCenterAgentMetrics> {
    await connectToDatabase();
    
    const orders = await Order.find({
      $or: [
        { assignedAgent: new mongoose.Types.ObjectId(agentId) },
        { 'callAttempts.callCenterAgent': new mongoose.Types.ObjectId(agentId) }
      ],
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalCalls = orders.reduce((sum, order) => sum + order.totalCallAttempts, 0);
    const successfulCalls = orders.filter(order => 
      order.callAttempts.some((attempt: any) => attempt.status === 'answered')
    ).length;
    
    const confirmedOrders = orders.filter(order => 
      order.status === OrderStatus.CONFIRMED && order.assignedAgent?.toString() === agentId
    ).length;
    
    const deliveredOrders = orders.filter(order => 
      order.status === OrderStatus.CONFIRMED && order.assignedAgent?.toString() === agentId
    ).length;
    
    const callSuccessRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    const orderConfirmationRate = orders.length > 0 ? (confirmedOrders / orders.length) * 100 : 0;
    
    // Calculate average call duration from recordings
    const callsWithDuration = orders.flatMap(order => 
      order.callAttempts.filter((attempt: any) => 
        attempt.callCenterAgent?.toString() === agentId && attempt.recording?.duration
      )
    );
    
    const avgCallDuration = callsWithDuration.length > 0 
      ? callsWithDuration.reduce((sum, call) => sum + (call.recording?.duration || 0), 0) / callsWithDuration.length / 60 // Convert to minutes
      : 0;
    
    // Get actual ratings from admins
    // Look for ratings where the period overlaps with our date range
    const ratings = await AgentRating.find({
      agentId: new mongoose.Types.ObjectId(agentId),
      status: 'SUBMITTED',
      $or: [
        // Rating period ends within our range
        { periodEnd: { $gte: startDate, $lte: endDate } },
        // Rating period starts within our range
        { periodStart: { $gte: startDate, $lte: endDate } },
        // Rating period encompasses our range
        { periodStart: { $lte: startDate }, periodEnd: { $gte: endDate } }
      ]
    });
    
    const totalCustomerRatings = ratings.length;
    let customerSatisfactionScore = 0;
    
    if (totalCustomerRatings > 0) {
      const totalScore = ratings.reduce((sum, rating) => sum + rating.finalScore, 0);
      customerSatisfactionScore = totalScore / totalCustomerRatings;
    } else {
      // Default score if no ratings yet
      customerSatisfactionScore = 0;
    }
    
    return {
      totalCalls,
      successfulCalls,
      confirmedOrders,
      deliveredOrders,
      callSuccessRate,
      avgCallDuration,
      orderConfirmationRate,
      customerSatisfactionScore,
      totalCustomerRatings,
      dailyTargetAchievement: Math.min(100, orderConfirmationRate * 1.2), // Based on performance
    };
  }
  
  static calculateTotalScore(
    type: LeaderboardType,
    metrics: ProviderMetrics | SellerMetrics | CallCenterAgentMetrics
  ): number {
    switch (type) {
      case LeaderboardType.PROVIDER:
        const providerMetrics = metrics as ProviderMetrics;
        const providerScore = (
          (providerMetrics.successfulDeliveries || 0) * 10 +
          (providerMetrics.customerRating || 0) * 20 +
          (providerMetrics.onTimeDeliveryRate || 0) * 2 +
          (100 - (providerMetrics.cancellationRate || 0)) * 1 +
          Math.min((providerMetrics.revenue || 0) / 1000, 100) * 5
        );
        return isNaN(providerScore) ? 0 : providerScore;
        
      case LeaderboardType.SELLER:
        const sellerMetrics = metrics as SellerMetrics;
        const sellerScore = (
          (sellerMetrics.confirmedOrders || 0) * 10 +
          (sellerMetrics.conversionRate || 0) * 3 +
          (sellerMetrics.deliveredOrders || 0) * 5 +
          (100 - (sellerMetrics.returnRate || 0)) * 2 +
          Math.min((sellerMetrics.revenue || 0) / 1000, 100) * 5
        );
        return isNaN(sellerScore) ? 0 : sellerScore;
        
      case LeaderboardType.CALL_CENTER_AGENT:
        const agentMetrics = metrics as CallCenterAgentMetrics;
        const score = (
          (agentMetrics.confirmedOrders || 0) * 15 +
          (agentMetrics.deliveredOrders || 0) * 20 +
          (agentMetrics.callSuccessRate || 0) * 2 +
          (agentMetrics.orderConfirmationRate || 0) * 3 +
          (agentMetrics.customerSatisfactionScore || 0) * 25 +
          (agentMetrics.dailyTargetAchievement || 0) * 1
        );
        return isNaN(score) ? 0 : score;
        
      default:
        return 0;
    }
  }
  
  static getPeriodDates(period: LeaderboardPeriod): { startDate: Date; endDate: Date } {
    const now = new Date();
    let endDate = new Date(now);
    let startDate = new Date(now);
    
    switch (period) {
      case LeaderboardPeriod.DAILY:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case LeaderboardPeriod.WEEKLY:
        const dayOfWeek = now.getDay();
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case LeaderboardPeriod.MONTHLY:
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case LeaderboardPeriod.YEARLY:
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case LeaderboardPeriod.ALL_TIME:
        startDate = new Date('2020-01-01');
        endDate = new Date();
        break;
    }
    
    return { startDate, endDate };
  }
  
  static async updateLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod
  ): Promise<void> {
    await connectToDatabase();
    
    const { startDate, endDate } = this.getPeriodDates(period);
    
    // Get all users of the relevant role
    let userRole: UserRole;
    switch (type) {
      case LeaderboardType.PROVIDER:
        userRole = UserRole.PROVIDER;
        break;
      case LeaderboardType.SELLER:
        userRole = UserRole.SELLER;
        break;
      case LeaderboardType.CALL_CENTER_AGENT:
        userRole = UserRole.CALL_CENTER;
        break;
    }
    
    const users = await User.find({ role: userRole, status: 'approved' });
    
    const leaderboardEntries = [];
    
    for (const user of users) {
      let metrics: ProviderMetrics | SellerMetrics | CallCenterAgentMetrics;
      
      switch (type) {
        case LeaderboardType.PROVIDER:
          metrics = await this.calculateProviderMetrics(user._id.toString(), startDate, endDate);
          break;
        case LeaderboardType.SELLER:
          metrics = await this.calculateSellerMetrics(user._id.toString(), startDate, endDate);
          break;
        case LeaderboardType.CALL_CENTER_AGENT:
          metrics = await this.calculateCallCenterAgentMetrics(user._id.toString(), startDate, endDate);
          break;
      }
      
      const totalScore = this.calculateTotalScore(type, metrics);
      
      // Ensure totalScore is a valid number
      const validScore = isNaN(totalScore) ? 0 : totalScore;
      
      // Find existing entry or create new one
      // For all-time period, be more flexible with date matching
      let existingEntry;
      if (period === LeaderboardPeriod.ALL_TIME) {
        existingEntry = await Leaderboard.findOne({
          userId: user._id,
          leaderboardType: type,
          period,
          isActive: true
        }).sort({ lastUpdated: -1 }); // Get most recent
      } else {
        existingEntry = await Leaderboard.findOne({
          userId: user._id,
          leaderboardType: type,
          period,
          periodStartDate: {
            $gte: new Date(startDate.getTime() - 60 * 60 * 1000), // 1 hour before
            $lte: new Date(startDate.getTime() + 60 * 60 * 1000)  // 1 hour after
          },
          periodEndDate: {
            $gte: new Date(endDate.getTime() - 60 * 60 * 1000),   // 1 hour before
            $lte: new Date(endDate.getTime() + 60 * 60 * 1000)    // 1 hour after
          }
        });
      }
      
      const leaderboardData: any = {
        userId: user._id,
        userRole: user.role,
        leaderboardType: type,
        period,
        periodStartDate: startDate,
        periodEndDate: endDate,
        totalScore: validScore,
        rank: 9999, // Temporary rank, will be updated after sorting
        lastUpdated: new Date(),
        isActive: true,
      };
      
      // Add metrics based on type and validate all numbers
      if (type === LeaderboardType.PROVIDER) {
        const providerMetrics = metrics as ProviderMetrics;
        // Ensure all metrics are valid numbers
        Object.keys(providerMetrics).forEach(key => {
          const value = (providerMetrics as any)[key];
          if (typeof value === 'number' && isNaN(value)) {
            (providerMetrics as any)[key] = 0;
          }
        });
        leaderboardData['providerMetrics'] = providerMetrics;
      } else if (type === LeaderboardType.SELLER) {
        const sellerMetrics = metrics as SellerMetrics;
        // Ensure all metrics are valid numbers
        Object.keys(sellerMetrics).forEach(key => {
          const value = (sellerMetrics as any)[key];
          if (typeof value === 'number' && isNaN(value)) {
            (sellerMetrics as any)[key] = 0;
          }
        });
        leaderboardData['sellerMetrics'] = sellerMetrics;
      } else if (type === LeaderboardType.CALL_CENTER_AGENT) {
        const agentMetrics = metrics as CallCenterAgentMetrics;
        // Ensure all metrics are valid numbers
        Object.keys(agentMetrics).forEach(key => {
          const value = (agentMetrics as any)[key];
          if (typeof value === 'number' && isNaN(value)) {
            (agentMetrics as any)[key] = 0;
          }
        });
        leaderboardData['callCenterAgentMetrics'] = agentMetrics;
      }
      
      if (existingEntry) {
        leaderboardData['previousRank'] = existingEntry.rank;
        await Leaderboard.updateOne(
          { _id: existingEntry._id },
          leaderboardData
        );
      } else {
        await Leaderboard.create(leaderboardData);
      }
      
      leaderboardEntries.push({ userId: user._id, totalScore: validScore });
    }
    
    // Sort by score and update ranks
    leaderboardEntries.sort((a, b) => b.totalScore - a.totalScore);
    
    for (let i = 0; i < leaderboardEntries.length; i++) {
      await Leaderboard.updateOne(
        {
          userId: leaderboardEntries[i].userId,
          leaderboardType: type,
          period,
          periodStartDate: startDate,
          periodEndDate: endDate,
        },
        { rank: i + 1 }
      );
    }
  }
  
  static async getLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    limit: number = 50
  ): Promise<ILeaderboard[]> {
    try {
      await connectToDatabase();
      
      const { startDate, endDate } = this.getPeriodDates(period);
      
      // Query by type and period, then filter by date range
      const allLeaderboards = await Leaderboard.find({
        leaderboardType: type,
        period,
        isActive: true,
      })
      .populate('userId', 'name email businessName')
      .sort({ lastUpdated: -1 }); // Sort by most recent first
      
      // Filter by date range with some tolerance for millisecond differences
      const filteredLeaderboard = allLeaderboards.filter(entry => {
        const entryStartTime = new Date(entry.periodStartDate).getTime();
        const entryEndTime = new Date(entry.periodEndDate).getTime();
        const targetStartTime = startDate.getTime();
        const targetEndTime = endDate.getTime();
        
        // Allow 1 hour tolerance for date matching
        const tolerance = 60 * 60 * 1000;
        
        return Math.abs(entryStartTime - targetStartTime) < tolerance &&
               Math.abs(entryEndTime - targetEndTime) < tolerance;
      });
      
      // Deduplicate by userId - keep only the most recent entry per user
      const userMap = new Map();
      filteredLeaderboard.forEach(entry => {
        const userId = entry.userId._id.toString();
        if (!userMap.has(userId) || new Date(entry.lastUpdated) > new Date(userMap.get(userId).lastUpdated)) {
          userMap.set(userId, entry);
        }
      });
      
      // Convert back to array and sort by rank
      const dedupedLeaderboard = Array.from(userMap.values())
        .sort((a, b) => a.rank - b.rank);
      
      const leaderboard = dedupedLeaderboard.slice(0, limit);
      
      return leaderboard || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }
  
  static async resetLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod
  ): Promise<void> {
    await connectToDatabase();
    
    const { startDate, endDate } = this.getPeriodDates(period);
    
    await Leaderboard.updateMany(
      {
        leaderboardType: type,
        period,
        periodStartDate: startDate,
        periodEndDate: endDate,
      },
      { isActive: false }
    );
  }
  
  static async updateAllLeaderboards(): Promise<void> {
    const types = Object.values(LeaderboardType);
    const periods = Object.values(LeaderboardPeriod);
    
    for (const type of types) {
      for (const period of periods) {
        try {
          await this.updateLeaderboard(type, period);
        } catch (error) {
          console.error(`Failed to update leaderboard ${type} ${period}:`, error);
        }
      }
    }
  }
}
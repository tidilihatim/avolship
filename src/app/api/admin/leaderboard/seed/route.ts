import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import { UserRole } from '@/lib/db/models/user';
import Leaderboard, { LeaderboardType, LeaderboardPeriod } from '@/lib/db/models/leaderboard';
import User from '@/lib/db/models/user';
import { LeaderboardService } from '@/services/leaderboard-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Get existing users
    const sellers = await User.find({ role: UserRole.SELLER, status: 'approved' }).limit(10);
    const providers = await User.find({ role: UserRole.PROVIDER, status: 'approved' }).limit(10);
    const agents = await User.find({ role: UserRole.CALL_CENTER, status: 'approved' }).limit(10);
    
    const { startDate, endDate } = LeaderboardService.getPeriodDates(LeaderboardPeriod.MONTHLY);
    
    // Create leaderboard entries for sellers
    let sellerCount = 0;
    for (const seller of sellers) {
      const metrics = {
        totalOrders: Math.floor(Math.random() * 100) + 20,
        confirmedOrders: 0,
        deliveredOrders: 0,
        conversionRate: Math.random() * 50 + 50, // 50-100%
        customerRating: Math.random() * 2 + 3, // 3-5
        totalRatingCount: 0,
        revenue: Math.random() * 100000 + 10000, // $10k-110k
        avgOrderValue: 0,
        returnRate: Math.random() * 10, // 0-10%
      };
      
      metrics.confirmedOrders = Math.floor(metrics.totalOrders * 0.8);
      metrics.deliveredOrders = Math.floor(metrics.confirmedOrders * 0.9);
      metrics.totalRatingCount = Math.floor(metrics.totalOrders * 0.6);
      metrics.avgOrderValue = metrics.revenue / metrics.totalOrders;
      
      const totalScore = LeaderboardService.calculateTotalScore(LeaderboardType.SELLER, metrics);
      
      await Leaderboard.findOneAndUpdate(
        {
          userId: seller._id,
          leaderboardType: LeaderboardType.SELLER,
          period: LeaderboardPeriod.MONTHLY,
          periodStartDate: startDate,
          periodEndDate: endDate,
        },
        {
          userId: seller._id,
          userRole: seller.role,
          leaderboardType: LeaderboardType.SELLER,
          period: LeaderboardPeriod.MONTHLY,
          periodStartDate: startDate,
          periodEndDate: endDate,
          sellerMetrics: metrics,
          totalScore,
          lastUpdated: new Date(),
          isActive: true,
        },
        { upsert: true }
      );
      sellerCount++;
    }
    
    // Create leaderboard entries for providers
    let providerCount = 0;
    for (const provider of providers) {
      const metrics = {
        totalDeliveries: Math.floor(Math.random() * 200) + 50,
        successfulDeliveries: 0,
        avgDeliveryTime: Math.random() * 24 + 12, // 12-36 hours
        customerRating: Math.random() * 2 + 3, // 3-5 rating
        totalRatingCount: 0,
        onTimeDeliveryRate: Math.random() * 30 + 70, // 70-100%
        cancellationRate: Math.random() * 10, // 0-10%
        revenue: Math.random() * 50000 + 10000, // $10k-60k
        avgOrderValue: 0,
      };
      
      metrics.successfulDeliveries = Math.floor(metrics.totalDeliveries * 0.9);
      metrics.totalRatingCount = Math.floor(metrics.totalDeliveries * 0.7);
      metrics.avgOrderValue = metrics.revenue / metrics.totalDeliveries;
      
      const totalScore = LeaderboardService.calculateTotalScore(LeaderboardType.PROVIDER, metrics);
      
      await Leaderboard.findOneAndUpdate(
        {
          userId: provider._id,
          leaderboardType: LeaderboardType.PROVIDER,
          period: LeaderboardPeriod.MONTHLY,
          periodStartDate: startDate,
          periodEndDate: endDate,
        },
        {
          userId: provider._id,
          userRole: provider.role,
          leaderboardType: LeaderboardType.PROVIDER,
          period: LeaderboardPeriod.MONTHLY,
          periodStartDate: startDate,
          periodEndDate: endDate,
          providerMetrics: metrics,
          totalScore,
          lastUpdated: new Date(),
          isActive: true,
        },
        { upsert: true }
      );
      providerCount++;
    }
    
    // Create leaderboard entries for call center agents
    let agentCount = 0;
    for (const agent of agents) {
      const metrics = {
        totalCalls: Math.floor(Math.random() * 300) + 50,
        successfulCalls: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        callSuccessRate: Math.random() * 40 + 60, // 60-100%
        avgCallDuration: Math.random() * 5 + 2, // 2-7 minutes
        orderConfirmationRate: Math.random() * 30 + 70, // 70-100%
        customerSatisfactionScore: Math.random() * 2 + 3, // 3-5
        totalCustomerRatings: 0,
        dailyTargetAchievement: Math.random() * 50 + 50, // 50-100%
      };
      
      metrics.successfulCalls = Math.floor(metrics.totalCalls * 0.8);
      metrics.confirmedOrders = Math.floor(metrics.successfulCalls * 0.7);
      metrics.deliveredOrders = Math.floor(metrics.confirmedOrders * 0.9);
      metrics.totalCustomerRatings = Math.floor(metrics.confirmedOrders * 0.5);
      
      const totalScore = LeaderboardService.calculateTotalScore(LeaderboardType.CALL_CENTER_AGENT, metrics);
      
      await Leaderboard.findOneAndUpdate(
        {
          userId: agent._id,
          leaderboardType: LeaderboardType.CALL_CENTER_AGENT,
          period: LeaderboardPeriod.MONTHLY,
          periodStartDate: startDate,
          periodEndDate: endDate,
        },
        {
          userId: agent._id,
          userRole: agent.role,
          leaderboardType: LeaderboardType.CALL_CENTER_AGENT,
          period: LeaderboardPeriod.MONTHLY,
          periodStartDate: startDate,
          periodEndDate: endDate,
          callCenterAgentMetrics: metrics,
          totalScore,
          lastUpdated: new Date(),
          isActive: true,
        },
        { upsert: true }
      );
      agentCount++;
    }
    
    // Update rankings
    const types = [LeaderboardType.SELLER, LeaderboardType.PROVIDER, LeaderboardType.CALL_CENTER_AGENT];
    for (const type of types) {
      const entries = await Leaderboard.find({
        leaderboardType: type,
        period: LeaderboardPeriod.MONTHLY,
        periodStartDate: startDate,
        periodEndDate: endDate,
        isActive: true,
      }).sort({ totalScore: -1 });
      
      for (let i = 0; i < entries.length; i++) {
        entries[i].rank = i + 1;
        await entries[i].save();
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Leaderboard data seeded successfully',
      data: {
        sellersProcessed: sellerCount,
        providersProcessed: providerCount,
        agentsProcessed: agentCount,
      }
    });
    
  } catch (error) {
    console.error('Error seeding leaderboard:', error);
    return NextResponse.json({ 
      error: 'Failed to seed leaderboard',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
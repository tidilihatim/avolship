import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import User, { UserRole } from '@/lib/db/models/user';
import Order, { OrderStatus } from '@/lib/db/models/order';
import Leaderboard, { LeaderboardType, LeaderboardPeriod } from '@/lib/db/models/leaderboard';
import { LeaderboardService } from '@/services/leaderboard-service';
import { hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Create test users if they don't exist
    const testUsers = {
      sellers: [
        { name: 'John Electronics Store', email: 'john@electronics.test', businessName: 'JohnTech Solutions' },
        { name: 'Sarah Fashion Boutique', email: 'sarah@fashion.test', businessName: 'Sarah\'s Style' },
        { name: 'Mike Sports Gear', email: 'mike@sports.test', businessName: 'SportZone' },
        { name: 'Emma Home Decor', email: 'emma@decor.test', businessName: 'Home Haven' },
        { name: 'David Books & More', email: 'david@books.test', businessName: 'BookWorm Paradise' },
      ],
      providers: [
        { name: 'FastShip Logistics', email: 'contact@fastship.test', businessName: 'FastShip Express' },
        { name: 'QuickDeliver Pro', email: 'info@quickdeliver.test', businessName: 'QuickDeliver' },
        { name: 'SafeTransport Co', email: 'hello@safetransport.test', businessName: 'SafeTransport' },
        { name: 'GlobalShipping Ltd', email: 'support@globalship.test', businessName: 'GlobalShip' },
        { name: 'LocalCourier Services', email: 'admin@localcourier.test', businessName: 'LocalCourier' },
      ],
      agents: [
        { name: 'Alice Johnson', email: 'alice@callcenter.test' },
        { name: 'Bob Smith', email: 'bob@callcenter.test' },
        { name: 'Carol Davis', email: 'carol@callcenter.test' },
        { name: 'Daniel Wilson', email: 'daniel@callcenter.test' },
        { name: 'Eva Martinez', email: 'eva@callcenter.test' },
      ],
    };
    
    const createdUsers = {
      sellers: [],
      providers: [],
      agents: [],
    };
    
    // Create or find sellers
    for (const userData of testUsers.sellers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          ...userData,
          password: await hash('password123', 12),
          role: UserRole.SELLER,
          status: 'approved',
        });
      }
      createdUsers.sellers.push(user);
    }
    
    // Create or find providers
    for (const userData of testUsers.providers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          ...userData,
          password: await hash('password123', 12),
          role: UserRole.PROVIDER,
          status: 'approved',
          serviceType: 'Express Delivery',
        });
      }
      createdUsers.providers.push(user);
    }
    
    // Create or find call center agents
    for (const userData of testUsers.agents) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          ...userData,
          password: await hash('password123', 12),
          role: UserRole.CALL_CENTER,
          status: 'approved',
        });
      }
      createdUsers.agents.push(user);
    }
    
    // Generate test orders for sellers and assign to agents
    const orderStatuses = [OrderStatus.CONFIRMED, OrderStatus.PENDING, OrderStatus.CANCELLED];
    const products = [
      { name: 'Laptop', price: 999 },
      { name: 'Smartphone', price: 699 },
      { name: 'Headphones', price: 199 },
      { name: 'Tablet', price: 499 },
      { name: 'Smart Watch', price: 299 },
    ];
    
    const createdOrders = [];
    
    for (const seller of createdUsers.sellers) {
      const orderCount = Math.floor(Math.random() * 50) + 20; // 20-70 orders per seller
      
      for (let i = 0; i < orderCount; i++) {
        const agent = createdUsers.agents[Math.floor(Math.random() * createdUsers.agents.length)];
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        const order = await Order.create({
          customer: {
            name: `Customer ${i + 1}`,
            phoneNumbers: [`+212${Math.floor(Math.random() * 900000000) + 100000000}`],
            shippingAddress: `${Math.floor(Math.random() * 999) + 1} Main Street, City`,
          },
          sellerId: seller._id,
          warehouseId: seller._id, // Mock warehouse
          products: [{
            productId: seller._id, // Mock product
            quantity,
            unitPrice: product.price,
            expeditionId: seller._id, // Mock expedition
          }],
          totalPrice: product.price * quantity,
          finalTotalPrice: product.price * quantity,
          status,
          assignedAgent: agent._id,
          orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          callAttempts: status === OrderStatus.CONFIRMED ? [{
            attemptNumber: 1,
            phoneNumber: `+212${Math.floor(Math.random() * 900000000) + 100000000}`,
            attemptDate: new Date(),
            status: 'answered',
            callCenterAgent: agent._id,
            recording: {
              duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
            },
          }] : [],
          totalCallAttempts: status === OrderStatus.CONFIRMED ? 1 : 0,
        });
        
        createdOrders.push(order);
      }
    }
    
    // Generate leaderboard entries with realistic metrics
    const periods = [LeaderboardPeriod.DAILY, LeaderboardPeriod.WEEKLY, LeaderboardPeriod.MONTHLY];
    
    for (const period of periods) {
      // Update seller leaderboard
      await LeaderboardService.updateLeaderboard(LeaderboardType.SELLER, period);
      
      // Update provider leaderboard
      await LeaderboardService.updateLeaderboard(LeaderboardType.PROVIDER, period);
      
      // Update call center agent leaderboard
      await LeaderboardService.updateLeaderboard(LeaderboardType.CALL_CENTER_AGENT, period);
    }
    
    // Generate some realistic metrics for providers (since we don't have real delivery data)
    const { startDate, endDate } = LeaderboardService.getPeriodDates(LeaderboardPeriod.MONTHLY);
    
    for (const provider of createdUsers.providers) {
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
    }
    
    // Re-rank all leaderboards
    for (const type of Object.values(LeaderboardType)) {
      for (const period of periods) {
        const { startDate, endDate } = LeaderboardService.getPeriodDates(period);
        
        const entries = await Leaderboard.find({
          leaderboardType: type,
          period,
          periodStartDate: startDate,
          periodEndDate: endDate,
          isActive: true,
        }).sort({ totalScore: -1 });
        
        for (let i = 0; i < entries.length; i++) {
          entries[i].rank = i + 1;
          await entries[i].save();
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test data generated successfully',
      data: {
        sellersCreated: createdUsers.sellers.length,
        providersCreated: createdUsers.providers.length,
        agentsCreated: createdUsers.agents.length,
        ordersCreated: createdOrders.length,
      }
    });
    
  } catch (error) {
    console.error('Error generating test data:', error);
    return NextResponse.json({ error: 'Failed to generate test data' }, { status: 500 });
  }
}
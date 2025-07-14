import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd, { AdStatus } from '@/lib/db/models/FeaturedProviderAd';
import { UserRole } from '@/lib/db/models/user';
import AdAnalytics from '@/lib/db/models/AdAnalytics';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

// GET /api/admin/featured-ads/analytics - Get analytics for all ads (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const dateRange = searchParams.get('dateRange') || '30days';
    
    // Calculate date range
    const now = new Date();
    const daysCount = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    const startDate = startOfDay(subDays(now, daysCount));
    
    // Fetch all ads with populated provider info
    const ads = await FeaturedProviderAd.find({})
      .populate('provider', 'businessName email')
      .lean();
    
    // Calculate totals
    let totalImpressions = 0;
    let totalClicks = 0;
    let activeAds = 0;
    let pendingAds = 0;
    let totalRevenue = 0;
    
    ads.forEach(ad => {
      totalImpressions += ad.impressions || 0;
      totalClicks += ad.clicks || 0;
      totalRevenue += ad.approvedPrice || ad.proposedPrice || 0;
      
      if (ad.status === AdStatus.ACTIVE) {
        activeAds++;
      } else if (ad.status === AdStatus.PENDING_APPROVAL) {
        pendingAds++;
      }
    });
    
    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    
    // Get detailed analytics data if available
    let dailyStats = [];
    try {
      // Try to get analytics from AdAnalytics collection first
      const analyticsData = await AdAnalytics.getDailyAnalytics(
        undefined, // Get for all ads
        startDate,
        endOfDay(now)
      );
      
      if (analyticsData && analyticsData.length > 0) {
        // Map analytics data to the expected format
        dailyStats = analyticsData.map(day => ({
          date: format(new Date(day.date), 'MMM dd'),
          ads: ads.filter(ad => 
            format(new Date(ad.createdAt), 'yyyy-MM-dd') === day.date
          ).length,
          revenue: ads
            .filter(ad => format(new Date(ad.createdAt), 'yyyy-MM-dd') === day.date)
            .reduce((sum, ad) => sum + (ad.approvedPrice || ad.proposedPrice || 0), 0),
          impressions: day.impressions,
          clicks: day.clicks
        }));
      }
    } catch (analyticsError) {
      console.log('AdAnalytics not available, falling back to ad data');
    }
    
    // Fallback: Calculate daily stats based on creation dates if no analytics data
    if (dailyStats.length === 0) {
      const dailyStatsMap = new Map();
      
      // Initialize all days with zero values
      for (let i = daysCount - 1; i >= 0; i--) {
        const date = format(subDays(now, i), 'MMM dd');
        dailyStatsMap.set(date, {
          date,
          ads: 0,
          revenue: 0,
          impressions: 0,
          clicks: 0
        });
      }
      
      // Aggregate data by day
      ads.forEach(ad => {
        const adDate = new Date(ad.createdAt);
        if (adDate >= startDate) {
          const dateKey = format(adDate, 'MMM dd');
          if (dailyStatsMap.has(dateKey)) {
            const stats = dailyStatsMap.get(dateKey);
            stats.ads += 1;
            stats.revenue += ad.approvedPrice || ad.proposedPrice || 0;
            stats.impressions += ad.impressions || 0;
            stats.clicks += ad.clicks || 0;
          }
        }
      });
      
      dailyStats = Array.from(dailyStatsMap.values());
    }
    
    // Provider stats
    const providerMap = new Map();
    ads.forEach(ad => {
      if (ad.provider) {
        const providerId = ad.provider._id.toString();
        if (!providerMap.has(providerId)) {
          providerMap.set(providerId, {
            provider: ad.provider.businessName || ad.provider.email,
            adsCount: 0,
            revenue: 0,
            impressions: 0,
            clicks: 0
          });
        }
        const stats = providerMap.get(providerId);
        stats.adsCount++;
        stats.revenue += ad.approvedPrice || ad.proposedPrice || 0;
        stats.impressions += ad.impressions || 0;
        stats.clicks += ad.clicks || 0;
      }
    });
    
    const topProviders = Array.from(providerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Status distribution
    const statusCounts = new Map();
    ads.forEach(ad => {
      statusCounts.set(ad.status, (statusCounts.get(ad.status) || 0) + 1);
    });
    
    const statusDistribution = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status: status.replace(/_/g, ' '),
      count
    }));
    
    // Placement performance
    const placementMap = new Map();
    ads.forEach(ad => {
      if (ad.placement && Array.isArray(ad.placement)) {
        ad.placement.forEach(placement => {
          if (!placementMap.has(placement)) {
            placementMap.set(placement, {
              placement: placement.replace(/_/g, ' '),
              impressions: 0,
              clicks: 0,
              revenue: 0
            });
          }
          const stats = placementMap.get(placement);
          stats.impressions += ad.impressions || 0;
          stats.clicks += ad.clicks || 0;
          stats.revenue += ad.approvedPrice || ad.proposedPrice || 0;
        });
      }
    });
    
    const placementPerformance = Array.from(placementMap.values());
    
    return NextResponse.json({
      totalAds: ads.length,
      activeAds,
      pendingAds,
      totalRevenue,
      totalImpressions,
      totalClicks,
      averageCTR: clickThroughRate,
      topProviders,
      dailyStats,
      statusDistribution,
      placementPerformance
    });
    
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
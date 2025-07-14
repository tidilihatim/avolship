import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd from '@/lib/db/models/FeaturedProviderAd';
import { UserRole } from '@/lib/db/models/user';
import { subDays, format } from 'date-fns';

// GET /api/provider/featured-ads/analytics - Get analytics for provider's ads
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.PROVIDER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7days';
    const adId = searchParams.get('adId');
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7days':
        startDate = subDays(endDate, 7);
        break;
      case '30days':
        startDate = subDays(endDate, 30);
        break;
      case '90days':
        startDate = subDays(endDate, 90);
        break;
      default:
        startDate = subDays(endDate, 7);
    }
    
    // Build query
    const query: any = { provider: session.user.id };
    if (adId && adId !== 'all') {
      query._id = adId;
    }
    
    // Fetch ads and calculate metrics
    const ads = await FeaturedProviderAd.find(query).lean();
    
    // Calculate totals
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpent = 0;
    let activeAds = 0;
    
    ads.forEach(ad => {
      totalImpressions += ad.impressions || 0;
      totalClicks += ad.clicks || 0;
      totalSpent += ad.spentAmount || 0;
      
      if (ad.isActive?.() || ad.status === 'ACTIVE') {
        activeAds++;
      }
    });
    
    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const costPerClick = totalClicks > 0 ? totalSpent / totalClicks : 0;
    
    // Find top performing ad
    const topPerformingAd = ads
      .filter(ad => ad.clicks > 0)
      .sort((a, b) => {
        const ctrA = a.impressions > 0 ? (a.clicks / a.impressions) : 0;
        const ctrB = b.impressions > 0 ? (b.clicks / b.impressions) : 0;
        return ctrB - ctrA;
      })[0];
    
    // Generate daily stats (mock data for now)
    const dailyStats = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - i - 1);
      dailyStats.push({
        date: format(date, 'MMM dd'),
        impressions: Math.floor(Math.random() * 1000) + 100,
        clicks: Math.floor(Math.random() * 50) + 5,
        spent: Math.random() * 20 + 5
      });
    }
    
    // Placement stats (aggregated from ads)
    const placementMap = new Map();
    ads.forEach(ad => {
      ad.placement?.forEach(placement => {
        if (!placementMap.has(placement)) {
          placementMap.set(placement, { impressions: 0, clicks: 0 });
        }
        const stats = placementMap.get(placement);
        stats.impressions += ad.impressions || 0;
        stats.clicks += ad.clicks || 0;
      });
    });
    
    const placementStats = Array.from(placementMap.entries()).map(([placement, stats]) => ({
      placement,
      impressions: stats.impressions,
      clicks: stats.clicks
    }));
    
    // Country stats (mock data for now)
    const countryStats = [
      { country: 'Morocco', impressions: Math.floor(totalImpressions * 0.3), clicks: Math.floor(totalClicks * 0.3) },
      { country: 'Algeria', impressions: Math.floor(totalImpressions * 0.2), clicks: Math.floor(totalClicks * 0.2) },
      { country: 'Tunisia', impressions: Math.floor(totalImpressions * 0.15), clicks: Math.floor(totalClicks * 0.15) },
      { country: 'Egypt', impressions: Math.floor(totalImpressions * 0.15), clicks: Math.floor(totalClicks * 0.15) },
      { country: 'Others', impressions: Math.floor(totalImpressions * 0.2), clicks: Math.floor(totalClicks * 0.2) }
    ];
    
    return NextResponse.json({
      totalImpressions,
      totalClicks,
      totalSpent,
      clickThroughRate,
      costPerClick,
      activeAds,
      topPerformingAd: topPerformingAd ? {
        id: topPerformingAd._id,
        title: topPerformingAd.title,
        clicks: topPerformingAd.clicks,
        impressions: topPerformingAd.impressions
      } : null,
      dailyStats,
      placementStats,
      countryStats
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
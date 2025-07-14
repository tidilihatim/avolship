import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd, { AdPlacement } from '@/lib/db/models/FeaturedProviderAd';
import { UserRole } from '@/lib/db/models/user';
import AdAnalytics, { AdEventType } from '@/lib/db/models/AdAnalytics';

// GET /api/featured-ads - Get active featured ads for sellers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only sellers can view featured ads
    if (!session?.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement') as AdPlacement;
    const limit = parseInt(searchParams.get('limit') || '5');
    
    // Get user's country for targeting
    const userCountry = session.user.country;
    
    // Get active ads using the static method
    const activeAds = await FeaturedProviderAd.getActiveAds(placement, userCountry);
    
    // Limit the results
    const ads = activeAds.slice(0, limit);
    
    // Track impressions asynchronously (don't wait for completion)
    const sessionId = req.headers.get('x-session-id') || session.user.id;
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';
    
    Promise.all([
      // Update impression counts in the ad documents
      ...ads.map(ad => 
        FeaturedProviderAd.findByIdAndUpdate(
          ad._id,
          { $inc: { impressions: 1 } },
          { new: false }
        )
      ),
      // Create detailed analytics records
      ...ads.map(ad =>
        AdAnalytics.create({
          adId: ad._id,
          eventType: AdEventType.IMPRESSION,
          userId: session.user.id,
          sessionId,
          userAgent,
          referrer,
          placement,
          metadata: {
            userRole: session.user.role,
            userCountry: session.user.country
          }
        })
      )
    ]).catch(error => {
      console.error('Error tracking impressions:', error);
    });
    
    return NextResponse.json({ ads });
  } catch (error) {
    console.error('Error fetching active featured ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured ads' },
      { status: 500 }
    );
  }
}
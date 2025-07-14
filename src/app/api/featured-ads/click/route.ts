import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd from '@/lib/db/models/FeaturedProviderAd';
import { UserRole } from '@/lib/db/models/user';
import AdAnalytics, { AdEventType } from '@/lib/db/models/AdAnalytics';

// POST /api/featured-ads/click - Track click on a featured ad
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { adId } = await req.json();
    
    if (!adId) {
      return NextResponse.json(
        { error: 'Ad ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const ad = await FeaturedProviderAd.findById(adId);
    
    if (!ad) {
      return NextResponse.json(
        { error: 'Ad not found' },
        { status: 404 }
      );
    }
    
    // Increment click count
    await ad.incrementClick();
    
    // Create detailed analytics record
    const sessionId = req.headers.get('x-session-id') || session.user.id;
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';
    
    await AdAnalytics.create({
      adId: ad._id,
      eventType: AdEventType.CLICK,
      userId: session.user.id,
      sessionId,
      userAgent,
      referrer,
      metadata: {
        userRole: session.user.role,
        userCountry: session.user.country
      }
    });
    
    return NextResponse.json({ 
      message: 'Click tracked successfully',
      redirectUrl: ad.ctaLink || `/dashboard/seller/providers/${ad.provider}`
    });
    
  } catch (error) {
    console.error('Error tracking ad click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
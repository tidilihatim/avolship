import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd from '@/lib/db/models/FeaturedProviderAd';
import { AdStatus } from '@/types/featured-provider-ad';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/providers/[id]/featured-ads - Get featured ads for a specific provider
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const providerId = params.id;
    
    // First, let's check all ads for this provider for debugging
    const allAds = await FeaturedProviderAd.find({ provider: providerId }).lean();
    console.log(`Total ads for provider ${providerId}: ${allAds.length}`);
    
    // Get active featured ads for this provider
    const ads = await FeaturedProviderAd.find({
      provider: providerId,
      status: AdStatus.ACTIVE,
      endDate: { $gte: new Date() }
    })
    .populate('provider', 'businessName businessInfo profileImage')
    .sort({ createdAt: -1 })
    .lean();
    
    console.log(`Found ${ads.length} active ads for provider ${providerId}`);
    
    return NextResponse.json({ 
      success: true,
      ads: ads || []
    });
    
  } catch (error) {
    console.error('Error fetching provider featured ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider ads' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd from '@/lib/db/models/FeaturedProviderAd';
import { AdStatus } from '@/types/featured-provider-ad';
import { UserRole } from '@/lib/db/models/user';

// GET /api/featured-ads/all - Get all active featured ads
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Get all active featured ads
    const ads = await FeaturedProviderAd.find({
      status: AdStatus.ACTIVE,
      endDate: { $gte: new Date() }
    })
    .populate('provider', 'businessName businessInfo profileImage country city serviceType')
    .sort({ createdAt: -1 })
    .lean();
    
    return NextResponse.json({ 
      success: true,
      ads: ads || []
    });
    
  } catch (error) {
    console.error('Error fetching all featured ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured ads' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd, { AdStatus } from '@/lib/db/models/FeaturedProviderAd';
import { UserRole } from '@/lib/db/models/user';

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH /api/provider/featured-ads/[id] - Update provider's own ad
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.PROVIDER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const body = await req.json();
    
    await connectToDatabase();
    
    const ad = await FeaturedProviderAd.findById(id);
    
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    
    // Check if provider owns this ad
    if (ad.provider.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Providers can only update certain fields and only if ad is pending or paused
    const allowedStatuses = [AdStatus.PENDING_APPROVAL, AdStatus.PAUSED, AdStatus.ACTIVE];
    if (!allowedStatuses.includes(ad.status)) {
      return NextResponse.json(
        { error: 'Cannot update ad in current status' },
        { status: 400 }
      );
    }
    
    // Allowed updates for providers
    const allowedUpdates = ['status']; // Only allow pausing/resuming
    
    if (body.status) {
      // Providers can only pause/resume active ads
      if (ad.status === AdStatus.ACTIVE && body.status === AdStatus.PAUSED) {
        ad.status = AdStatus.PAUSED;
      } else if (ad.status === AdStatus.PAUSED && body.status === AdStatus.ACTIVE) {
        ad.status = AdStatus.ACTIVE;
      } else {
        return NextResponse.json(
          { error: 'Invalid status update' },
          { status: 400 }
        );
      }
    }
    
    ad.lastModifiedBy = session.user.id;
    await ad.save();
    
    return NextResponse.json({ 
      message: 'Ad updated successfully',
      ad 
    });
    
  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { error: 'Failed to update ad' },
      { status: 500 }
    );
  }
}

// DELETE /api/provider/featured-ads/[id] - Delete provider's own ad
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.PROVIDER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    await connectToDatabase();
    
    const ad = await FeaturedProviderAd.findById(id);
    
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    
    // Check if provider owns this ad
    if (ad.provider.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Can only delete pending ads
    if (ad.status !== AdStatus.PENDING_APPROVAL) {
      return NextResponse.json(
        { error: 'Can only delete pending ads' },
        { status: 400 }
      );
    }
    
    await ad.deleteOne();
    
    return NextResponse.json({ 
      message: 'Ad deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { error: 'Failed to delete ad' },
      { status: 500 }
    );
  }
}
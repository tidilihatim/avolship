import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd, { AdStatus } from '@/lib/db/models/FeaturedProviderAd';
import { UserRole } from '@/lib/db/models/user';
import { z } from 'zod';

// PATCH /api/admin/featured-ads/[id] - Update ad status (approve/reject)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { action, approvedPrice, rejectionReason, approvalNotes } = body;
    
    await connectToDatabase();
    
    const { id } = await params;
    const ad = await FeaturedProviderAd.findById(id);
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    
    // Update based on action
    if (action === 'approve') {
      ad.status = AdStatus.APPROVED;
      ad.approvedPrice = approvedPrice || ad.proposedPrice;
      ad.approvalNotes = approvalNotes;
      ad.approvedBy = session.user.id;
      ad.approvedAt = new Date();
      
      // If start date has passed, make it active immediately
      if (ad.startDate <= new Date()) {
        ad.status = AdStatus.ACTIVE;
      }
      
      await ad.save();
      
      // Trigger Socket.io notification through API call to realtime server
      try {
        const socketApiUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
        await fetch(`${socketApiUrl}/api/ads/notify-approved`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SOCKET_SERVER_API_SECRET_KEY}`
          },
          body: JSON.stringify({
            adId: ad._id.toString(),
            providerId: ad.provider.toString()
          })
        });
      } catch (error) {
        console.error('Failed to send socket notification:', error);
      }
      
      return NextResponse.json({ 
        message: 'Ad approved successfully',
        ad 
      });
      
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }
      
      ad.status = AdStatus.REJECTED;
      ad.rejectionReason = rejectionReason;
      ad.approvedBy = session.user.id;
      ad.approvedAt = new Date();
      
      await ad.save();
      
      // Trigger Socket.io notification through API call to realtime server
      try {
        const socketApiUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
        await fetch(`${socketApiUrl}/api/ads/notify-rejected`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SOCKET_SERVER_API_SECRET_KEY}`
          },
          body: JSON.stringify({
            adId: ad._id.toString(),
            providerId: ad.provider.toString(),
            reason: rejectionReason
          })
        });
      } catch (error) {
        console.error('Failed to send socket notification:', error);
      }
      
      return NextResponse.json({ 
        message: 'Ad rejected',
        ad 
      });
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { error: 'Failed to update ad' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/featured-ads/[id] - Delete an ad
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { id } = await params;
    const ad = await FeaturedProviderAd.findByIdAndDelete(id);
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Ad deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { error: 'Failed to delete ad' },
      { status: 500 }
    );
  }
}
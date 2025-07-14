import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd, { AdStatus } from '@/lib/db/models/FeaturedProviderAd';
import { UserRole } from '@/lib/db/models/user';
import { z } from 'zod';

// GET /api/provider/featured-ads - Get provider's own ads
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.PROVIDER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const query: any = { provider: session.user.id };
    
    if (status && status !== 'ALL') {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const [ads, total] = await Promise.all([
      FeaturedProviderAd.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeaturedProviderAd.countDocuments(query)
    ]);
    
    return NextResponse.json({
      ads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching provider ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}

// POST /api/provider/featured-ads - Create a new ad
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.PROVIDER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    await connectToDatabase();
    
    // Create the ad with provider as the creator
    const ad = new FeaturedProviderAd({
      ...body,
      provider: session.user.id,
      status: AdStatus.PENDING_APPROVAL,
      priority: 2, // Default medium priority
      createdBy: session.user.id,
      lastModifiedBy: session.user.id,
      spentAmount: 0,
      impressions: 0,
      clicks: 0,
      paymentStatus: 'PENDING'
    });
    
    await ad.save();
    
    // Notify admins about new pending ad
    try {
      const socketApiUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
      await fetch(`${socketApiUrl}/api/ads/notify-pending`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SOCKET_SERVER_API_SECRET_KEY}`
        },
        body: JSON.stringify({
          adId: ad._id.toString()
        })
      });
    } catch (error) {
      console.error('Failed to send socket notification:', error);
    }
    
    return NextResponse.json({ 
      message: 'Ad created successfully and submitted for approval',
      ad 
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating ad:', error);
    return NextResponse.json(
      { error: 'Failed to create ad' },
      { status: 500 }
    );
  }
}
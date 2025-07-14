import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import FeaturedProviderAd, { AdStatus, AdPlacement } from '@/lib/db/models/FeaturedProviderAd';
import User, { UserRole } from '@/lib/db/models/user';
import { featuredProviderAdSchema } from '@/lib/validations/featured-provider-ad';
import { z } from 'zod';

// GET /api/admin/featured-ads - Get all featured ads (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const placement = searchParams.get('placement');
    const providerId = searchParams.get('provider');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const query: any = {};
    
    if (status && status !== 'ALL') {
      query.status = status;
    }
    
    if (placement) {
      query.placement = { $in: [placement] };
    }
    
    if (providerId) {
      query.provider = providerId;
    }
    
    const skip = (page - 1) * limit;
    
    const [ads, total] = await Promise.all([
      FeaturedProviderAd.find(query)
        .populate('provider', 'businessName email businessInfo serviceType')
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .sort({ priority: -1, createdAt: -1 })
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
    console.error('Error fetching featured ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured ads' },
      { status: 500 }
    );
  }
}

// POST /api/admin/featured-ads - Create a new featured ad (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validate input
    const validatedData = featuredProviderAdSchema.parse(body);
    
    await connectToDatabase();
    
    // Verify provider exists and is approved
    const provider = await User.findById(validatedData.provider);
    if (!provider || provider.role !== UserRole.PROVIDER) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }
    
    if (provider.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Provider must be approved to create featured ads' },
        { status: 400 }
      );
    }
    
    // Create the featured ad
    const ad = new FeaturedProviderAd({
      ...validatedData,
      createdBy: session.user.id,
      lastModifiedBy: session.user.id,
      spentAmount: 0,
      impressions: 0,
      clicks: 0
    });
    
    await ad.save();
    
    // Populate provider details before returning
    await ad.populate('provider', 'businessName email businessInfo serviceType');
    
    return NextResponse.json({ 
      message: 'Featured ad created successfully',
      ad 
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating featured ad:', error);
    return NextResponse.json(
      { error: 'Failed to create featured ad' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/featured-ads - Update a featured ad (admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ad ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const ad = await FeaturedProviderAd.findById(id);
    if (!ad) {
      return NextResponse.json(
        { error: 'Featured ad not found' },
        { status: 404 }
      );
    }
    
    // Update fields
    Object.assign(ad, updateData, {
      lastModifiedBy: session.user.id
    });
    
    // If approving, also set approved by
    if (updateData.status === AdStatus.APPROVED) {
      ad.approvedBy = session.user.id;
      ad.approvedAt = new Date();
      // Activate the ad if payment is already made
      if (ad.paymentStatus === 'PAID') {
        ad.status = AdStatus.ACTIVE;
      }
    }
    
    // If marking as paid and ad is approved, activate it
    if (updateData.paymentStatus === 'PAID' && ad.status === AdStatus.APPROVED) {
      ad.status = AdStatus.ACTIVE;
    }
    
    await ad.save();
    
    // Populate details before returning
    await ad.populate('provider', 'businessName email businessInfo serviceType');
    
    return NextResponse.json({ 
      message: 'Featured ad updated successfully',
      ad 
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating featured ad:', error);
    return NextResponse.json(
      { error: 'Failed to update featured ad' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/featured-ads - Delete a featured ad (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ad ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const ad = await FeaturedProviderAd.findByIdAndDelete(id);
    
    if (!ad) {
      return NextResponse.json(
        { error: 'Featured ad not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Featured ad deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting featured ad:', error);
    return NextResponse.json(
      { error: 'Failed to delete featured ad' },
      { status: 500 }
    );
  }
}
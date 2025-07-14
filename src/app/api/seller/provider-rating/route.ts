import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import ProviderRating from '@/lib/db/models/provider-rating';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      sourcingRequestId,
      qualityScore,
      communicationScore,
      reliabilityScore,
      pricingScore,
      review,
      wouldRecommend,
      deliveredOnTime,
      productQualityMet,
      pricingAsAgreed,
      packagingQuality,
      tags
    } = body;

    // Verify sourcing request exists and belongs to seller
    const sourcingRequest = await SourcingRequest.findOne({
      _id: new mongoose.Types.ObjectId(sourcingRequestId),
      sellerId: new mongoose.Types.ObjectId(session.user.id),
      status: 'DELIVERED'
    });

    if (!sourcingRequest) {
      return NextResponse.json({ 
        error: 'Sourcing request not found or not eligible for rating' 
      }, { status: 404 });
    }

    // Check if already rated
    const existingRating = await ProviderRating.findOne({
      sourcingRequestId: new mongoose.Types.ObjectId(sourcingRequestId)
    });

    if (existingRating) {
      return NextResponse.json({ 
        error: 'This sourcing request has already been rated' 
      }, { status: 400 });
    }

    // Create rating
    const rating = await ProviderRating.create({
      providerId: sourcingRequest.providerId,
      sellerId: session.user.id,
      sourcingRequestId,
      qualityScore,
      communicationScore,
      reliabilityScore,
      pricingScore,
      review,
      wouldRecommend,
      deliveredOnTime,
      productQualityMet,
      pricingAsAgreed,
      packagingQuality,
      tags: tags || []
    });

    // Update provider's average rating in leaderboard service
    // This will be picked up by the next leaderboard update

    return NextResponse.json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Error creating provider rating:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const sourcingRequestId = searchParams.get('sourcingRequestId');

    let query: any = {
      sellerId: new mongoose.Types.ObjectId(session.user.id),
      status: 'ACTIVE'
    };

    if (providerId) {
      query.providerId = new mongoose.Types.ObjectId(providerId);
    }

    if (sourcingRequestId) {
      query.sourcingRequestId = new mongoose.Types.ObjectId(sourcingRequestId);
    }

    const ratings = await ProviderRating.find(query)
      .populate('providerId', 'name email businessName')
      .populate('sourcingRequestId', 'requestNumber productName')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('Error fetching provider ratings:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
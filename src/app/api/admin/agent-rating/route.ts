import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import AgentRating from '@/lib/db/models/agent-rating';
import User from '@/lib/db/models/user';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MODERATOR', 'admin', 'moderator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    console.log('Received rating data:', body);

    const {
      agentId,
      periodStart,
      periodEnd,
      periodType,
      adminBoostPercentage,
      adminBoostReason,
      totalCallsHandled,
      successfulCalls,
      confirmedOrders,
      deliveredOrders,
      avgCallDuration,
      callSuccessRate,
      orderConfirmationRate,
      deliveryRate,
      status
    } = body;

    // Verify agent exists and is a call center agent
    const agent = await User.findOne({
      _id: new mongoose.Types.ObjectId(agentId),
      role: 'call_center',
      status: 'approved'
    });

    if (!agent) {
      return NextResponse.json({ 
        error: 'Agent not found or not a call center agent' 
      }, { status: 404 });
    }

    // Check for existing rating in the same period
    const existingRating = await AgentRating.findOne({
      agentId: new mongoose.Types.ObjectId(agentId),
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd)
    });

    if (existingRating && status === 'SUBMITTED') {
      return NextResponse.json({ 
        error: 'Rating already exists for this period' 
      }, { status: 400 });
    }

    // Create or update rating - only include fields that exist in the schema
    const ratingData = {
      agentId,
      adminId: session.user.id,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      periodType,
      adminBoostPercentage: adminBoostPercentage || 0,
      adminBoostReason: adminBoostReason || '',
      totalCallsHandled: totalCallsHandled || 0,
      successfulCalls: successfulCalls || 0,
      confirmedOrders: confirmedOrders || 0,
      deliveredOrders: deliveredOrders || 0,
      avgCallDuration: avgCallDuration || 0,
      callSuccessRate: callSuccessRate || 0,
      orderConfirmationRate: orderConfirmationRate || 0,
      deliveryRate: deliveryRate || 0,
      status: status || 'DRAFT'
    };

    let rating;
    if (existingRating) {
      rating = await AgentRating.findByIdAndUpdate(
        existingRating._id,
        ratingData,
        { new: true }
      );
    } else {
      rating = await AgentRating.create(ratingData);
    }

    return NextResponse.json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Error creating agent rating:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MODERATOR', 'admin', 'moderator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const periodType = searchParams.get('periodType');
    const status = searchParams.get('status');

    let query: any = {};

    if (agentId) {
      query.agentId = new mongoose.Types.ObjectId(agentId);
    }

    if (periodType) {
      query.periodType = periodType;
    }

    if (status) {
      query.status = status;
    }

    const ratings = await AgentRating.find(query)
      .populate('agentId', 'name email')
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('Error fetching agent ratings:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
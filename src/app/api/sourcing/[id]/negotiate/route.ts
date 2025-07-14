import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import { negotiationMessageSchema } from '@/lib/validations/sourcing';
import { logger } from '@/lib/logging/logger';

// POST /api/sourcing/[id]/negotiate - Add negotiation message
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    console.log('Negotiation request body:', body);
    console.log('User role:', session.user.role);
    
    // Validate message data
    let validatedData;
    try {
      validatedData = negotiationMessageSchema.parse(body);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      throw validationError;
    }

    await connectToDatabase();

    const sourcingRequest = await SourcingRequest.findById(params.id);

    if (!sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 });
    }

    console.log('Sourcing request found:', {
      id: sourcingRequest._id,
      status: sourcingRequest.status,
      sellerId: sourcingRequest.sellerId,
      providerId: sourcingRequest.providerId,
      currentUserId: session.user.id
    });

    // Check if user is involved in this negotiation
    const isSeller = sourcingRequest.sellerId.toString() === session.user.id;
    const isProvider = sourcingRequest.providerId?.toString() === session.user.id;
    const isProviderRole = ['provider', 'PROVIDER'].includes(session.user.role);
    
    // Allow sellers, assigned providers, or any provider (if no provider assigned yet)
    if (!isSeller && !isProvider && !(isProviderRole && !sourcingRequest.providerId)) {
      return NextResponse.json({ error: 'Not authorized to negotiate' }, { status: 403 });
    }
    
    // If this is a provider joining for the first time, assign them
    if (isProviderRole && !sourcingRequest.providerId) {
      sourcingRequest.providerId = session.user.id;
    }

    // Check if negotiation is allowed (allow for PENDING and NEGOTIATING status)
    if (!['PENDING', 'NEGOTIATING'].includes(sourcingRequest.status)) {
      return NextResponse.json({ error: 'Negotiation not available for this request' }, { status: 400 });
    }
    
    // Update status to NEGOTIATING if it was PENDING
    if (sourcingRequest.status === 'PENDING') {
      sourcingRequest.status = 'NEGOTIATING';
    }

    // Add negotiation message
    sourcingRequest.negotiations.push({
      senderId: session.user.id,
      senderRole: isSeller ? 'SELLER' : 'PROVIDER',
      message: validatedData.message,
      priceOffer: validatedData.priceOffer,
      quantityOffer: validatedData.quantityOffer,
      timestamp: new Date(),
    });

    await sourcingRequest.save();

    // Log the negotiation
    await logger.info('Negotiation message added', {
      userId: session.user.id,
      action: 'SOURCING_NEGOTIATION',
      resourceId: sourcingRequest._id,
      metadata: {
        requestNumber: sourcingRequest.requestNumber,
        senderRole: isSeller ? 'seller' : 'provider',
        hasOffer: !!(validatedData.priceOffer || validatedData.quantityOffer),
      }
    });

    return NextResponse.json({
      success: true,
      data: sourcingRequest
    });

  } catch (error: any) {
    await logger.error('Failed to add negotiation message', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid message data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add negotiation message' },
      { status: 500 }
    );
  }
}

// GET /api/sourcing/[id]/negotiate - Get negotiation history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const sourcingRequest = await SourcingRequest.findById(params.id)
      .select('negotiations sellerId providerId')
      .populate('negotiations.senderId', 'name email role')
      .lean();

    if (!sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 });
    }

    // Check if user is involved in this negotiation
    const isSeller = sourcingRequest.sellerId.toString() === session.user.id;
    const isProvider = sourcingRequest.providerId?.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    if (!isSeller && !isProvider && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to view negotiations' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: sourcingRequest.negotiations
    });

  } catch (error: any) {
    await logger.error('Failed to fetch negotiations', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    return NextResponse.json(
      { error: 'Failed to fetch negotiations' },
      { status: 500 }
    );
  }
}
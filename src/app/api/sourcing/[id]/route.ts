import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import { updateSourcingRequestSchema } from '@/lib/validations/sourcing';
import { logger } from '@/lib/logging/logger';

// GET /api/sourcing/[id] - Get single sourcing request
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
      .populate('sellerId', 'name email company phone')
      .populate('providerId', 'name email company phone')
      .populate('destinationWarehouse', 'name location country')
      .populate('negotiations.senderId', 'name email role')
      .lean();

    if (!sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = 
      session.user.role === 'admin' ||
      sourcingRequest.sellerId._id.toString() === session.user.id ||
      sourcingRequest.providerId?._id.toString() === session.user.id ||
      (session.user.role === 'provider' && sourcingRequest.status === 'PENDING');

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: sourcingRequest
    });

  } catch (error: any) {
    await logger.error('Failed to fetch sourcing request', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    return NextResponse.json(
      { error: 'Failed to fetch sourcing request' },
      { status: 500 }
    );
  }
}

// PATCH /api/sourcing/[id] - Update sourcing request
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    await connectToDatabase();

    const sourcingRequest = await SourcingRequest.findById(params.id);

    if (!sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 });
    }

    // Only seller can update their own request when it's still pending
    if (sourcingRequest.sellerId.toString() !== session.user.id || 
        sourcingRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cannot update this request' }, { status: 403 });
    }

    // Validate update data
    const validatedData = updateSourcingRequestSchema.parse(body);

    // Update the request
    Object.assign(sourcingRequest, validatedData);
    await sourcingRequest.save();

    // Log the update
    await logger.info('Sourcing request updated', {
      userId: session.user.id,
      action: 'SOURCING_REQUEST_UPDATED',
      resourceId: sourcingRequest._id,
      metadata: {
        requestNumber: sourcingRequest.requestNumber,
        updates: Object.keys(validatedData),
      }
    });

    return NextResponse.json({
      success: true,
      data: sourcingRequest
    });

  } catch (error: any) {
    await logger.error('Failed to update sourcing request', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update sourcing request' },
      { status: 500 }
    );
  }
}

// DELETE /api/sourcing/[id] - Cancel sourcing request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const sourcingRequest = await SourcingRequest.findById(params.id);

    if (!sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 });
    }

    // Only seller can cancel their own request when it's still pending
    if (sourcingRequest.sellerId.toString() !== session.user.id || 
        !['PENDING', 'NEGOTIATING'].includes(sourcingRequest.status)) {
      return NextResponse.json({ error: 'Cannot cancel this request' }, { status: 403 });
    }

    // Update status to cancelled
    sourcingRequest.status = 'CANCELLED';
    await sourcingRequest.save();

    // Log the cancellation
    await logger.warn('Sourcing request cancelled', {
      userId: session.user.id,
      action: 'SOURCING_REQUEST_CANCELLED',
      resourceId: sourcingRequest._id,
      metadata: {
        requestNumber: sourcingRequest.requestNumber,
        previousStatus: sourcingRequest.status,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Sourcing request cancelled successfully'
    });

  } catch (error: any) {
    await logger.error('Failed to cancel sourcing request', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    return NextResponse.json(
      { error: 'Failed to cancel sourcing request' },
      { status: 500 }
    );
  }
}
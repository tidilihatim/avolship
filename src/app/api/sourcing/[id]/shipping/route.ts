import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import { shippingDetailsSchema } from '@/lib/validations/sourcing';
import { logger } from '@/lib/logging/logger';

// POST /api/sourcing/[id]/shipping - Update shipping details
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate shipping data
    const validatedData = shippingDetailsSchema.parse(body);

    await connectToDatabase();

    const sourcingRequest = await SourcingRequest.findById(params.id);

    if (!sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 });
    }

    // Check if provider is assigned to this request
    if (sourcingRequest.providerId?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to update shipping' }, { status: 403 });
    }

    // Check if request is paid
    if (sourcingRequest.status !== 'PAID') {
      return NextResponse.json({ error: 'Request must be paid before shipping' }, { status: 400 });
    }

    // Update shipping details
    sourcingRequest.status = 'SHIPPING';
    sourcingRequest.shippingDetails = {
      ...validatedData,
      shippedAt: new Date(),
    };

    await sourcingRequest.save();

    // Log the shipping update
    await logger.info('Sourcing shipment created', {
      userId: session.user.id,
      action: 'SOURCING_SHIPPED',
      resourceId: sourcingRequest._id,
      metadata: {
        requestNumber: sourcingRequest.requestNumber,
        trackingNumber: validatedData.trackingNumber,
        carrier: validatedData.carrier,
        estimatedDelivery: validatedData.estimatedDelivery,
      }
    });

    return NextResponse.json({
      success: true,
      data: sourcingRequest
    });

  } catch (error: any) {
    await logger.error('Failed to update shipping', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid shipping data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update shipping' },
      { status: 500 }
    );
  }
}

// PATCH /api/sourcing/[id]/shipping - Mark as delivered
export async function PATCH(
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

    // Check if user can mark as delivered (provider or admin)
    const canMarkDelivered = 
      sourcingRequest.providerId?.toString() === session.user.id ||
      session.user.role === 'admin';

    if (!canMarkDelivered) {
      return NextResponse.json({ error: 'Not authorized to update delivery' }, { status: 403 });
    }

    // Check if request is shipping
    if (sourcingRequest.status !== 'SHIPPING') {
      return NextResponse.json({ error: 'Request must be shipping to mark as delivered' }, { status: 400 });
    }

    // Update to delivered
    sourcingRequest.status = 'DELIVERED';
    if (sourcingRequest.shippingDetails) {
      sourcingRequest.shippingDetails.deliveredAt = new Date();
    }

    await sourcingRequest.save();

    // Log the delivery
    await logger.info('Sourcing request delivered', {
      userId: session.user.id,
      action: 'SOURCING_DELIVERED',
      resourceId: sourcingRequest._id,
      metadata: {
        requestNumber: sourcingRequest.requestNumber,
        deliveredAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      data: sourcingRequest
    });

  } catch (error: any) {
    await logger.error('Failed to mark as delivered', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    return NextResponse.json(
      { error: 'Failed to mark as delivered' },
      { status: 500 }
    );
  }
}
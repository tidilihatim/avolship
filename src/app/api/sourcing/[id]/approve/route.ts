import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import { approveSourcingSchema } from '@/lib/validations/sourcing';
import { logger } from '@/lib/logging/logger';

// POST /api/sourcing/[id]/approve - Provider approves sourcing request
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'PROVIDER' && session.user.role !== 'provider')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate approval data
    const validatedData = approveSourcingSchema.parse(body);

    await connectToDatabase();

    const sourcingRequest = await SourcingRequest.findById(params.id);

    if (!sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 });
    }

    // Check if provider is assigned to this request
    if (sourcingRequest.providerId?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to approve this request' }, { status: 403 });
    }

    // Check if request can be approved
    if (sourcingRequest.status !== 'NEGOTIATING') {
      return NextResponse.json({ error: 'Request cannot be approved in current state' }, { status: 400 });
    }

    // Update request with approval
    sourcingRequest.status = 'APPROVED';
    sourcingRequest.approvedAt = new Date();
    sourcingRequest.approvedBy = session.user.id;
    sourcingRequest.finalPrice = validatedData.finalPrice;
    sourcingRequest.finalQuantity = validatedData.finalQuantity;

    await sourcingRequest.save();

    // Log the approval
    await logger.info('Sourcing request approved', {
      userId: session.user.id,
      action: 'SOURCING_APPROVED',
      resourceId: sourcingRequest._id,
      metadata: {
        requestNumber: sourcingRequest.requestNumber,
        finalPrice: validatedData.finalPrice,
        finalQuantity: validatedData.finalQuantity,
        totalValue: validatedData.finalPrice * validatedData.finalQuantity,
      }
    });

    return NextResponse.json({
      success: true,
      data: sourcingRequest
    });

  } catch (error: any) {
    await logger.error('Failed to approve sourcing request', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid approval data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to approve sourcing request' },
      { status: 500 }
    );
  }
}
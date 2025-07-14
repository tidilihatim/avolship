import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import { providerResponseSchema } from '@/lib/validations/sourcing';
import { logger } from '@/lib/logging/logger';

// POST /api/sourcing/[id]/respond - Provider responds to sourcing request
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
    
    // Validate response data
    const validatedData = providerResponseSchema.parse(body);

    await connectToDatabase();

    const sourcingRequest = await SourcingRequest.findById(params.id);

    if (!sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 });
    }

    // Check if request is available for providers
    if (!['PENDING', 'NEGOTIATING'].includes(sourcingRequest.status)) {
      return NextResponse.json({ error: 'Request is not available for response' }, { status: 400 });
    }

    // Update provider response
    sourcingRequest.providerId = session.user.id;
    sourcingRequest.status = 'NEGOTIATING';
    sourcingRequest.providerResponse = {
      ...validatedData,
      respondedAt: new Date(),
    };

    await sourcingRequest.save();

    // Log the response
    await logger.info('Provider responded to sourcing request', {
      userId: session.user.id,
      action: 'SOURCING_PROVIDER_RESPONSE',
      resourceId: sourcingRequest._id,
      metadata: {
        requestNumber: sourcingRequest.requestNumber,
        adjustedPrice: validatedData.adjustedPrice,
        adjustedQuantity: validatedData.adjustedQuantity,
      }
    });

    return NextResponse.json({
      success: true,
      data: sourcingRequest
    });

  } catch (error: any) {
    await logger.error('Failed to respond to sourcing request', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid response data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to respond to sourcing request' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import { paymentDetailsSchema } from '@/lib/validations/sourcing';
import { logger } from '@/lib/logging/logger';

// POST /api/sourcing/[id]/payment - Mark payment as completed
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
    
    // Validate payment data
    const validatedData = paymentDetailsSchema.parse(body);

    await connectToDatabase();

    const sourcingRequest = await SourcingRequest.findById(params.id);

    if (!sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 });
    }

    // Check if provider is assigned to this request
    if (sourcingRequest.providerId?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to update payment' }, { status: 403 });
    }

    // Check if request is approved
    if (sourcingRequest.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Request must be approved before payment' }, { status: 400 });
    }

    // Update payment details
    sourcingRequest.status = 'PAID';
    sourcingRequest.paymentStatus = 'PAID';
    sourcingRequest.paymentDetails = {
      ...validatedData,
      paidAt: new Date(),
    };

    await sourcingRequest.save();

    // Log the payment
    await logger.info('Sourcing payment confirmed', {
      userId: session.user.id,
      action: 'SOURCING_PAYMENT_CONFIRMED',
      resourceId: sourcingRequest._id,
      metadata: {
        requestNumber: sourcingRequest.requestNumber,
        amount: validatedData.amount,
        method: validatedData.method,
        transactionId: validatedData.transactionId,
      }
    });

    return NextResponse.json({
      success: true,
      data: sourcingRequest
    });

  } catch (error: any) {
    await logger.error('Failed to update payment', error, {
      userId: session?.user?.id,
      requestId: params.id,
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid payment data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
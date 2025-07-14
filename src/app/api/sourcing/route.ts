import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import Product from '@/lib/db/models/product';
import { createSourcingRequestSchema } from '@/lib/validations/sourcing';
import { logger } from '@/lib/logging/logger';
import { z } from 'zod';

// GET /api/sourcing - List sourcing requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query based on user role
    const query: any = {};
    
    if (session.user.role === 'seller' || session.user.role === 'SELLER') {
      query.sellerId = session.user.id;
    } else if (session.user.role === 'provider' || session.user.role === 'PROVIDER') {
      // Providers see all pending requests or ones assigned to them
      query.$or = [
        { status: 'PENDING' },
        { providerId: session.user.id }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      SourcingRequest.find(query)
        .populate('sellerId', 'name email company')
        .populate('providerId', 'name email company')
        .populate('productId', 'name code description image')
        .populate('destinationWarehouse', 'name location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SourcingRequest.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    await logger.error('Failed to fetch sourcing requests', error, {
      userId: session?.user?.id,
      url: req.url,
    });

    return NextResponse.json(
      { error: 'Failed to fetch sourcing requests' },
      { status: 500 }
    );
  }
}

// POST /api/sourcing - Create new sourcing request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'seller' && session.user.role !== 'SELLER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    console.log('Received sourcing request data:', body);
    
    // Validate request
    let validatedData;
    try {
      validatedData = createSourcingRequestSchema.parse(body);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    await connectToDatabase();

    // Find the product and verify ownership
    const product = await Product.findOne({ 
      _id: validatedData.productId,
      sellerId: session.user.id 
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or you do not have access' },
        { status: 404 }
      );
    }

    // Generate unique request number
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 5).toUpperCase();
    const requestNumber = `SR-${timestamp}-${randomId}`;

    // Create new sourcing request with product information
    const sourcingRequest = new SourcingRequest({
      ...validatedData,
      requestNumber,
      sellerId: session.user.id,
      productName: product.name,
      productDescription: product.description,
      productImages: product.image ? [product.image.url] : [],
      category: 'other', // Default category, you might want to add this to Product model
      status: 'PENDING',
      paymentStatus: 'PENDING',
      negotiations: [],
      tags: [],
      specifications: {}
    });

    await sourcingRequest.save();

    // Populate references
    await sourcingRequest.populate([
      { path: 'sellerId', select: 'name email company' },
      { path: 'productId', select: 'name code description image' },
      { path: 'destinationWarehouse', select: 'name location' }
    ]);

    // Log the creation
    await logger.info('Sourcing request created', {
      userId: session.user.id,
      action: 'SOURCING_REQUEST_CREATED',
      resourceId: sourcingRequest._id,
      metadata: {
        requestNumber: sourcingRequest.requestNumber,
        productName: sourcingRequest.productName,
        quantity: sourcingRequest.quantity,
        targetPrice: sourcingRequest.targetPrice,
      }
    });

    return NextResponse.json({
      success: true,
      data: sourcingRequest
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create sourcing request:', error);
    console.error('Error stack:', error.stack);
    
    await logger.error('Failed to create sourcing request', error, {
      userId: session?.user?.id,
      url: req.url,
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create sourcing request',
        details: error.message || 'Unknown error',
        type: error.name || 'Error'
      },
      { status: 500 }
    );
  }
}
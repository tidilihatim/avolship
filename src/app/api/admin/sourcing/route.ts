import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import { logger } from '@/lib/logging/logger';

export async function GET(req: NextRequest) {
  let session: any;
  
  try {
    session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const dateFilter = searchParams.get('dateFilter');
    const country = searchParams.get('country');
    const expeditionStatus = searchParams.get('expeditionStatus');
    const paymentMethod = searchParams.get('paymentMethod');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (country && country !== 'all') {
      query.sourcingCountry = country;
    }

    if (expeditionStatus && expeditionStatus !== 'all') {
      query['shippingDetails.expeditionStatus'] = expeditionStatus;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query['paymentDetails.method'] = paymentMethod;
    }

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      query.createdAt = { $gte: startDate };
    }

    const [requests, total] = await Promise.all([
      SourcingRequest.find(query)
        .populate('sellerId', 'name email company')
        .populate('providerId', 'name email company')
        .populate('destinationWarehouse', 'name location country')
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
    await logger.error('Failed to fetch admin sourcing requests', error, {
      userId: session?.user?.id,
      url: req.url,
    });

    return NextResponse.json(
      { error: 'Failed to fetch sourcing requests' },
      { status: 500 }
    );
  }
}
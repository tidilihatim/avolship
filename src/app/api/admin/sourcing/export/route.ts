import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SourcingRequest from '@/lib/db/models/sourcing-request';
import { logger } from '@/lib/logging/logger';

export async function POST(req: NextRequest) {
  let session: any;
  
  try {
    session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { status, dateFilter, country, expeditionStatus, paymentMethod } = await req.json();

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

    const requests = await SourcingRequest.find(query)
      .populate('sellerId', 'name email company')
      .populate('providerId', 'name email company')
      .populate('destinationWarehouse', 'name location country')
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV
    const csvHeaders = [
      'Request Number',
      'Product Name',
      'Status',
      'Seller Name',
      'Seller Email',
      'Provider Name',
      'Provider Email',
      'Sourcing Country',
      'Quantity',
      'Target Price',
      'Final Price',
      'Currency',
      'Total Value',
      'Urgency Level',
      'Destination Warehouse',
      'Created Date',
      'Required By Date',
      'Approved Date',
      'Payment Status',
      'Payment Amount',
      'Payment Method',
      'Expedition Status'
    ];

    const csvRows = requests.map(request => [
      request.requestNumber,
      request.productName,
      request.status,
      request.sellerId.name,
      request.sellerId.email,
      request.providerId?.name || '',
      request.providerId?.email || '',
      request.sourcingCountry || '',
      request.quantity,
      request.targetPrice,
      request.finalPrice || '',
      request.currency,
      request.finalPrice && request.finalQuantity 
        ? (request.finalPrice * request.finalQuantity).toFixed(2)
        : '',
      request.urgencyLevel,
      request.destinationWarehouse.name,
      new Date(request.createdAt).toISOString().split('T')[0],
      new Date(request.requiredByDate).toISOString().split('T')[0],
      request.approvedAt ? new Date(request.approvedAt).toISOString().split('T')[0] : '',
      request.paymentStatus,
      request.paymentDetails?.amount || '',
      request.paymentDetails?.method || '',
      request.shippingDetails?.expeditionStatus || ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Log the export
    await logger.info('Sourcing data exported', {
      userId: session.user.id,
      action: 'SOURCING_DATA_EXPORT',
      metadata: {
        recordCount: requests.length,
        filters: { status, dateFilter, country, expeditionStatus, paymentMethod },
        format: 'CSV'
      }
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sourcing-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    await logger.error('Failed to export sourcing data', error, {
      userId: session?.user?.id,
      url: req.url,
    });

    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
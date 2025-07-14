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
    
    // Debug logging
    console.log('Session debug:', {
      hasSession: !!session,
      user: session?.user,
      role: session?.user?.role,
      headers: req.headers.get('cookie'),
    });
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          userRole: session?.user?.role,
        }
      }, { status: 401 });
    }

    await connectToDatabase();

    const [
      totalRequests,
      completedRequests,
      totalValue,
      avgProcessingTime,
      topProviders,
      topSellers
    ] = await Promise.all([
      // Total requests
      SourcingRequest.countDocuments(),
      
      // Completed requests
      SourcingRequest.countDocuments({ status: 'DELIVERED' }),
      
      // Total value of completed requests
      SourcingRequest.aggregate([
        { $match: { status: 'DELIVERED', finalPrice: { $exists: true }, finalQuantity: { $exists: true } } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$finalPrice', '$finalQuantity'] } } } }
      ]),
      
      // Average processing time
      SourcingRequest.aggregate([
        { $match: { status: 'DELIVERED', approvedAt: { $exists: true } } },
        { $project: { processingTime: { $subtract: ['$approvedAt', '$createdAt'] } } },
        { $group: { _id: null, avgTime: { $avg: '$processingTime' } } }
      ]),
      
      // Top providers
      SourcingRequest.aggregate([
        { $match: { providerId: { $exists: true } } },
        { $group: { 
          _id: '$providerId', 
          count: { $sum: 1 },
          totalValue: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ['$finalPrice', null] }, { $ne: ['$finalQuantity', null] }] },
                { $multiply: ['$finalPrice', '$finalQuantity'] },
                0
              ]
            }
          }
        }},
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'provider' } },
        { $unwind: '$provider' },
        { $project: { name: '$provider.name', count: 1, value: '$totalValue' } },
        { $sort: { value: -1 } },
        { $limit: 10 }
      ]),
      
      // Top sellers
      SourcingRequest.aggregate([
        { $group: { 
          _id: '$sellerId', 
          count: { $sum: 1 },
          totalValue: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ['$finalPrice', null] }, { $ne: ['$finalQuantity', null] }] },
                { $multiply: ['$finalPrice', '$finalQuantity'] },
                0
              ]
            }
          }
        }},
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
        { $unwind: '$seller' },
        { $project: { name: '$seller.name', count: 1, value: '$totalValue' } },
        { $sort: { value: -1 } },
        { $limit: 10 }
      ])
    ]);

    const stats = {
      totalRequests,
      totalValue: totalValue[0]?.totalValue || 0,
      averageValue: totalRequests > 0 ? (totalValue[0]?.totalValue || 0) / totalRequests : 0,
      completionRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0,
      avgProcessingTime: avgProcessingTime[0]?.avgTime 
        ? Math.round(avgProcessingTime[0].avgTime / (1000 * 60 * 60 * 24)) // Convert to days
        : 0,
      topProviders: topProviders.map(p => ({
        name: p.name,
        count: p.count,
        value: p.value
      })),
      topSellers: topSellers.map(s => ({
        name: s.name,
        count: s.count,
        value: s.value
      }))
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    await logger.error('Failed to fetch sourcing stats', error, {
      userId: session?.user?.id,
      url: req.url,
    });

    return NextResponse.json(
      { error: 'Failed to fetch sourcing statistics' },
      { status: 500 }
    );
  }
}
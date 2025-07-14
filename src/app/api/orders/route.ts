import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import Order from '@/lib/db/models/order';
import { withApiLogging, logCriticalOperation } from '@/lib/logging/api-logger';
import { cache } from '@/lib/redis';

async function handler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Create order
      const order = await Order.create({
        ...body,
        sellerId: session.user.id,
      });

      // Log critical operation
      await logCriticalOperation(
        'CREATE_ORDER',
        'order',
        order._id.toString(),
        {
          orderId: order.orderId,
          totalPrice: order.totalPrice,
          customer: order.customer.name,
        }
      );

      // Invalidate cache
      await cache.invalidatePattern('orders:*');

      return NextResponse.json({
        success: true,
        order,
      });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    // Error is logged by withApiLogging
    throw error;
  }
}

// Wrap handler with logging
export const POST = withApiLogging(handler);
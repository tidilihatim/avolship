import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import Product from '@/lib/db/models/product';
import SourcingRequest from '@/lib/db/models/sourcing-request';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['seller', 'admin', 'SELLER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Define the test product names that were created by the seed script
    const testProductNames = [
      'Wireless Bluetooth Headphones',
      'Smart Watch Series 5',
      'USB-C Hub Adapter',
      'Portable Power Bank 20000mAh',
      'Laptop Stand Adjustable'
    ];

    // Delete products that match the test pattern
    const deleteResult = await Product.deleteMany({
      sellerId: session.user.id,
      name: { $in: testProductNames },
      description: { $regex: /^High quality .* for testing sourcing requests$/ }
    });

    // Also delete associated sourcing requests
    const sourcingResult = await SourcingRequest.deleteMany({
      sellerId: session.user.id,
      requestNumber: { $regex: /^SR-\d+-\d+$/ },
      notes: { $regex: /^Test sourcing request \d+$/ }
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        message: 'Test data cleaned up successfully',
        productsDeleted: deleteResult.deletedCount,
        sourcingRequestsDeleted: sourcingResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ 
      error: 'Failed to cleanup test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
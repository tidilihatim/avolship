import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import Warehouse from '@/lib/db/models/warehouse';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch warehouses that are either:
    // 1. Available to all sellers (isAvailableToAll: true)
    // 2. Specifically assigned to this seller
    const warehouses = await Warehouse.find({
      $or: [
        { isAvailableToAll: true },
        { assignedSellers: session.user.id }
      ],
      isActive: true
    })
    .sort({ country: 1, city: 1 })
    .lean();

    // Transform data to match frontend expectations
    const transformedWarehouses = warehouses.map(warehouse => ({
      ...warehouse,
      location: warehouse.city || warehouse.location // Frontend expects 'location' field
    }));

    return NextResponse.json({ 
      success: true, 
      data: transformedWarehouses,
      total: transformedWarehouses.length 
    });
  } catch (error) {
    console.error('Warehouses API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch warehouses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
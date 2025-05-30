import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { UserRole } from '@/lib/db/models/user';
import { connectToDatabase } from '@/lib/db/mongoose';
import Warehouse from '@/lib/db/models/warehouse';
import { getLoginUserRole } from '@/app/actions/auth';


/**
 * GET handler to fetch active warehouses for a seller
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication and seller role
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.SELLER) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get current seller's ID
    const sellerId = session.user.id;
    const userRole = await getLoginUserRole()

    // Find warehouses that are either available to all or assigned to this seller

    let query = {}
    if (userRole === UserRole.SELLER) {
      query = {
        isActive: true,
        $or: [
          { isAvailableToAll: true },
          { assignedSellers: sellerId },
        ]
      }
    }


    const warehouses = await Warehouse.find(query)
      .sort({ name: 1 })
      .select('_id name country city currency');

    if (!warehouses || warehouses.length === 0) {
      return NextResponse.json(
        { warehouses: [], message: 'No active warehouses found' },
        { status: 200 }
      );
    }

    // Return warehouses
    return NextResponse.json({ warehouses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching active warehouses:', error);

    return NextResponse.json(
      { error: 'Failed to fetch active warehouses' },
      { status: 500 }
    );
  }
}
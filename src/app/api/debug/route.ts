import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import Product from '@/lib/db/models/product';
import Warehouse from '@/lib/db/models/warehouse';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    await connectToDatabase();

    // Get counts and sample data
    const productCount = await Product.countDocuments();
    const warehouseCount = await Warehouse.countDocuments();
    
    const sampleProducts = await Product.find().limit(3).lean();
    const sampleWarehouses = await Warehouse.find().limit(3).lean();

    return NextResponse.json({ 
      success: true, 
      data: {
        session: session ? { user: session.user } : null,
        database: {
          connected: true,
          productCount,
          warehouseCount,
          sampleProducts,
          sampleWarehouses
        }
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      session: null,
      database: {
        connected: false
      }
    }, { status: 500 });
  }
}
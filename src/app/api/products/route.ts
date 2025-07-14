import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import Product from '@/lib/db/models/product';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    // Build query - sellers only see their own products
    const query: any = { sellerId: session.user.id };
    
    // Only filter by status if explicitly provided
    // For sourcing requests, we want all products
    if (status && status !== 'all') {
      query.status = status.toLowerCase(); // Product model uses lowercase status
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      data: products,
      total: products.length 
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
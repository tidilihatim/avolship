import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import User from '@/lib/db/models/user';
import { UserRole } from '@/lib/db/models/user';

// GET /api/providers - Get all active providers
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country');
    const serviceType = searchParams.get('serviceType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build query
    const query: any = {
      role: UserRole.PROVIDER,
      isActive: true
    };
    
    if (country) {
      query['businessInfo.country'] = country;
    }
    
    if (serviceType) {
      query.serviceType = serviceType;
    }
    
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { 'businessInfo.description': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [providers, total] = await Promise.all([
      User.find(query)
        .select('businessName email businessInfo serviceType profileImage isVerified createdAt')
        .sort({ isVerified: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);
    
    return NextResponse.json({
      providers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
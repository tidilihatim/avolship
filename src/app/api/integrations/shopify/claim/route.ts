import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import UserIntegration, { IntegrationStatus } from '@/lib/db/models/user-integration';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { integrationId, userId } = body;
    
    if (!integrationId || !userId) {
      return NextResponse.json({ error: 'Integration ID and User ID are required' }, { status: 400 });
    }

    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get warehouseId from cookies
    const cookieStore = await cookies();
    const warehouseId = cookieStore.get('selectedWarehouse')?.value || '';
    
    if (!warehouseId) {
      return NextResponse.json({ error: 'No warehouse selected' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Find the pending integration
    const pendingIntegration = await UserIntegration.findById(integrationId);
    
    if (!pendingIntegration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (pendingIntegration.status !== IntegrationStatus.PENDING) {
      return NextResponse.json({ error: 'Integration is not pending' }, { status: 400 });
    }

    // Check if user already has an integration for this platform and warehouse
    const existingIntegration = await UserIntegration.findOne({
      userId: userId,
      warehouseId: warehouseId,
      platformId: 'shopify',
      status: IntegrationStatus.CONNECTED,
      isActive: true
    });

    if (existingIntegration) {
      return NextResponse.json({ error: 'User already has an active Shopify integration for this warehouse' }, { status: 400 });
    }

    // Claim the integration - update with user and warehouse info
    pendingIntegration.userId = userId;
    pendingIntegration.warehouseId = warehouseId;
    pendingIntegration.status = IntegrationStatus.CONNECTED;
    pendingIntegration.connectionData.pendingClaim = false;
    pendingIntegration.lastSyncAt = new Date();
    pendingIntegration.updatedAt = new Date();

    // Save the updated integration
    await pendingIntegration.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Integration claimed successfully',
      integration: {
        id: pendingIntegration._id,
        shop: pendingIntegration.connectionData.shop,
        storeName: pendingIntegration.connectionData.storeInfo?.name
      }
    });

  } catch (error) {
    console.error('Shopify claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
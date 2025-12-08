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

    let finalIntegration;

    if (existingIntegration) {
      // User is reinstalling - update existing integration with new credentials
      console.log('Updating existing Shopify integration with new credentials:', existingIntegration._id);

      // Replace connectionData entirely with new credentials (new access token, webhooks, etc.)
      existingIntegration.connectionData = pendingIntegration.connectionData;
      existingIntegration.connectionData.pendingClaim = false;
      existingIntegration.status = IntegrationStatus.CONNECTED;
      existingIntegration.isActive = true;
      existingIntegration.lastSyncAt = new Date();
      existingIntegration.updatedAt = new Date();

      await existingIntegration.save();

      // Delete the pending integration as it's been merged
      await UserIntegration.findByIdAndDelete(integrationId);

      finalIntegration = existingIntegration;
    } else {
      // New installation - claim the pending integration
      pendingIntegration.userId = userId;
      pendingIntegration.warehouseId = warehouseId;
      pendingIntegration.status = IntegrationStatus.CONNECTED;
      pendingIntegration.connectionData.pendingClaim = false;
      pendingIntegration.lastSyncAt = new Date();
      pendingIntegration.updatedAt = new Date();

      await pendingIntegration.save();

      finalIntegration = pendingIntegration;
    }

    return NextResponse.json({
      success: true,
      message: existingIntegration ? 'Integration updated successfully' : 'Integration claimed successfully',
      integration: {
        id: finalIntegration._id,
        shop: finalIntegration.connectionData.shop,
        storeName: finalIntegration.connectionData.storeInfo?.name
      }
    });

  } catch (error) {
    console.error('Shopify claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
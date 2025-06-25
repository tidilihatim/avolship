import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import UserIntegration, { IntegrationMethod, IntegrationStatus } from '@/lib/db/models/user-integration';

export async function POST(request: NextRequest) {
  try {
    const { tokenData, state } = await request.json();

    if (!tokenData || !state) {
      return NextResponse.json({ error: 'Missing token data or state' }, { status: 400 });
    }

    // Validate state parameter to get userId and warehouseId
    const stateData = validateState(state);
    if (!stateData) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const { userId, warehouseId } = stateData;

    await connectToDatabase();

    // Calculate expiration date (1 year from now)
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Prepare connection data
    const connectionData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: expiresAt,
      storeId: tokenData.shop?.id?.toString() || 'unknown',
      storeName: tokenData.shop?.name || 'YouCan Store',
      storeUrl: tokenData.shop?.domain || '',
      warehouseId: warehouseId, // Associate with specific warehouse
      webhookSubscriptions: []
    };

    // Check if integration already exists for this user and warehouse
    const existingIntegration = await UserIntegration.findOne({
      userId,
      platformId: 'youcan',
      integrationMethod: IntegrationMethod.DIRECT,
      'connectionData.warehouseId': warehouseId,
      isActive: true
    });

    if (existingIntegration) {
      // Update existing integration
      existingIntegration.connectionData = connectionData;
      existingIntegration.status = IntegrationStatus.CONNECTED;
      existingIntegration.lastSyncAt = new Date();
      await existingIntegration.save();

      console.log('Updated existing YouCan integration for user:', userId);
    } else {
      // Create new integration
      const integration = new UserIntegration({
        userId,
        platformId: 'youcan',
        integrationMethod: IntegrationMethod.DIRECT,
        status: IntegrationStatus.CONNECTED,
        connectionData,
        syncStats: {
          totalOrdersSynced: 0,
          syncErrors: 0
        }
      });

      await integration.save();
      console.log('Created new YouCan integration for user:', userId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving YouCan tokens:', error);
    return NextResponse.json({ error: 'Failed to save tokens' }, { status: 500 });
  }
}

function validateState(state: string): { userId: string; warehouseId: string } | null {
  try {
    const decoded = Buffer.from(state, 'base64').toString();
    const [userId, warehouseId, timestamp] = decoded.split(':');

    // Check if state is not older than 10 minutes
    const stateTime = parseInt(timestamp);
    const now = Date.now();
    if (now - stateTime > 10 * 60 * 1000) {
      return null;
    }

    return { userId, warehouseId };
  } catch {
    return null;
  }
}
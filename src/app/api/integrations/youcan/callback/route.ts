import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=${error}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=missing_parameters`);
    }

    // Validate state parameter
    const stateData = validateState(state);
    if (!stateData) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=invalid_state`);
    }

    const { userId, warehouseId } = stateData;

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(code);
    
    if (!tokenData) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=token_exchange_failed`);
    }

    // Save tokens to database
    await saveYouCanTokens(userId, warehouseId, tokenData);

    // Subscribe to webhooks
    await subscribeToWebhooks(tokenData.access_token, userId, warehouseId);

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?success=youcan_connected`);
    
  } catch (error) {
    console.error('YouCan callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=internal_error`);
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

async function exchangeCodeForToken(code: string) {
  try {
    const clientId = process.env.YOUCAN_CLIENT_ID;
    const clientSecret = process.env.YOUCAN_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/youcan/callback`;

    if (!clientId || !clientSecret) {
      console.error('YouCan OAuth credentials not configured');
      return null;
    }

    const response = await fetch('https://api.youcan.shop/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', response.status, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token exchange error:', error);
    return null;
  }
}

async function saveYouCanTokens(userId: string, warehouseId: string, tokenData: any) {
  await connectToDatabase();
  
  try {
    // Import the models
    const UserIntegration = (await import('@/lib/db/models/user-integration')).default;
    const { IntegrationMethod, IntegrationStatus } = await import('@/lib/db/models/user-integration');
    
    // Calculate expiration date (1 year from now)
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    // Prepare connection data
    const connectionData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: expiresAt,
      webhookSubscriptions: []
    };
    
    // Check if integration already exists for this user and warehouse
    const existingIntegration = await UserIntegration.findOne({
      userId,
      warehouseId,
      platformId: 'youcan',
      integrationMethod: IntegrationMethod.DIRECT,
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
        warehouseId,
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
    
  } catch (error) {
    console.error('Error saving YouCan tokens:', error);
    throw error;
  }
}

async function subscribeToWebhooks(accessToken: string, userId: string, warehouseId: string) {
  try {
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/youcan`;
    
    console.log('Subscribing to order.create webhook...');
    
    // Subscribe to order.create event using correct YouCan REST Hooks endpoint
    const response = await fetch('https://api.youcan.shop/resthooks/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_url: webhookUrl,
        event: 'order.create'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to subscribe to order.create:', response.status, errorText);
      return [];
    }

    const hookData = await response.json();
    const webhookSubscription = {
      event: 'order.create',
      id: hookData.id,
      target_url: webhookUrl,
      createdAt: new Date()
    };

    console.log(`Successfully subscribed to order.create webhook with ID: ${hookData.id}`);

    // Update integration with webhook subscription
    const UserIntegration = (await import('@/lib/db/models/user-integration')).default;
    const { IntegrationMethod } = await import('@/lib/db/models/user-integration');
    
    await UserIntegration.findOneAndUpdate(
      {
        userId,
        warehouseId,
        platformId: 'youcan',
        integrationMethod: IntegrationMethod.DIRECT,
        isActive: true
      },
      {
        'connectionData.webhookSubscriptions': [webhookSubscription]
      }
    );

    console.log('Successfully subscribed to YouCan order.create webhook');
    return [webhookSubscription];
    
  } catch (error) {
    console.error('Failed to subscribe to webhooks:', error);
    return [];
  }
}
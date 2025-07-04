import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import UserIntegration, { IntegrationMethod, IntegrationStatus } from '@/lib/db/models/user-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const shop = searchParams.get('shop');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorParam = encodeURIComponent(error === 'access_denied' ? 'access_denied' : 'authorization_failed');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=${errorParam}`);
    }

    if (!code || !state || !shop) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=missing_parameters`);
    }

    // Decode state parameter
    let decodedState;
    try {
      const stateString = Buffer.from(state, 'base64').toString('utf-8');
      const parts = stateString.split(':');
      
      if (parts[0] !== 'user' || parts.length < 6) {
        throw new Error('Invalid state format');
      }
      
      decodedState = {
        userId: parts[1],
        warehouseId: parts[2],
        shop: parts[3],
        timestamp: parts[4],
        random: parts[5]
      };
    } catch (err) {
      console.error('State decode error:', err);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=invalid_state`);
    }

    // Verify the shop matches
    if (decodedState.shop !== shop) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=shop_mismatch`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token: accessToken, scope } = tokenData;

    // Get store information
    const storeResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!storeResponse.ok) {
      console.error('Failed to get store info:', storeResponse.status);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=store_info_failed`);
    }

    const storeData = await storeResponse.json();
    const storeInfo = storeData.shop;

    // Connect to database
    await connectToDatabase();

    // Check if integration already exists
    const existingIntegration = await UserIntegration.findOne({
      userId: decodedState.userId,
      platformId: 'shopify',
      'connectionData.shop': shop,
      isActive: true
    });

    let integration;

    if (existingIntegration) {
      // Update existing integration
      integration = existingIntegration;
      integration.connectionData.accessToken = accessToken;
      integration.connectionData.scope = scope;
      integration.connectionData.storeInfo = storeInfo;
      integration.status = IntegrationStatus.CONNECTED;
      integration.lastSyncAt = new Date();
      integration.updatedAt = new Date();
    } else {
      // Create new integration
      integration = new UserIntegration({
        userId: decodedState.userId,
        warehouseId: decodedState.warehouseId,
        platformId: 'shopify',
        integrationMethod: IntegrationMethod.DIRECT,
        status: IntegrationStatus.CONNECTED,
        connectionData: {
          accessToken,
          scope,
          shop,
          storeUrl: shop,
          storeInfo,
          authorizationCompleted: true
        },
        syncStats: {
          totalOrdersSynced: 0,
          syncErrors: 0
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create webhooks and get webhook data
    const webhookData = await createShopifyWebhooks(shop, accessToken, integration._id?.toString() || 'temp');
    
    if (!webhookData) {
      console.error('Failed to create Shopify webhooks - aborting integration');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=webhook_creation_failed`);
    }

    // Store webhook subscription info in integration
    integration.connectionData.webhookSubscriptions = [{
      topic: 'orders/create',
      id: webhookData.id,
      target_url: webhookData.address,
      createdAt: new Date()
    }];

    // Save integration to database
    await integration.save();

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?success=shopify_connected`);

  } catch (error) {
    console.error('Shopify callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=internal_error`);
  }
}

async function createShopifyWebhooks(shop: string, accessToken: string, integrationId: string): Promise<any | null> {
  try {
    const baseWebhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/shopify`;
    
    // Create only orders/create webhook
    const webhookResponse = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'orders/create',
          address: `${baseWebhookUrl}?integrationId=${integrationId}&topic=orders/create`,
          format: 'json'
        }
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Failed to create orders/create webhook:', webhookResponse.status, errorText);
      return null;
    }

    const webhookData = await webhookResponse.json();
    console.log('Successfully created orders/create webhook:', webhookData);
    return webhookData.webhook;
  } catch (error) {
    console.error('Failed to create Shopify webhook:', error);
    return null;
  }
}
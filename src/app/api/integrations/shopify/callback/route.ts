import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
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
      return redirect(`/auth/connect-store?error=${errorParam}`);
    }

    if (!code || !state || !shop) {
      return redirect('/auth/connect-store?error=missing_parameters');
    }

    // Decode state parameter
    let decodedState;
    let isInstallFlow = false;
    
    try {
      const stateString = Buffer.from(state, 'base64').toString('utf-8');
      const parts = stateString.split(':');
      
      if (parts[0] === 'install') {
        // This is an install flow
        isInstallFlow = true;
        decodedState = { shop: parts[1] };
      } else {
        // This is a regular user flow
        const [userId, warehouseId, storeUrl] = parts;
        decodedState = { userId, warehouseId, storeUrl };
      }
    } catch (err) {
      return redirect('/auth/connect-store?error=invalid_state');
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
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenResponse.status);
      return redirect('/auth/connect-store?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const { access_token: accessToken, scope } = tokenData;

    // Get store information
    const storeResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!storeResponse.ok) {
      console.error('Failed to get store info:', storeResponse.status);
      return redirect('/auth/connect-store?error=store_info_failed');
    }

    const storeData = await storeResponse.json();
    const storeInfo = storeData.shop;

    if (isInstallFlow) {
      // Handle install flow - create a pending integration
      await handleInstallFlow(shop, accessToken, scope, storeInfo);
      return redirect(`/auth/connect-store?shop=${shop}&installed=true`);
    } else {
      // Handle regular user flow - your existing logic
      await connectToDatabase();

    // Check if integration already exists
    const existingIntegration = await UserIntegration.findOne({
      userId: decodedState.userId,
      platformId: 'shopify',
      'connectionData.shop': shop,
      isActive: true
    });

    let integration;
    let isNewIntegration = false;

    if (existingIntegration) {
      integration = existingIntegration;
      // Update existing integration
      integration.connectionData.accessToken = accessToken;
      integration.connectionData.scope = scope;
      integration.connectionData.storeInfo = storeInfo;
      integration.status = IntegrationStatus.CONNECTED;
      integration.lastSyncAt = new Date();
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
        isActive: true
      });
      isNewIntegration = true;
    }

    // Create webhooks before saving to database
    const webhookSuccess = await createShopifyWebhooks(shop, accessToken, integration._id?.toString() || 'temp');
    
    if (!webhookSuccess) {
      console.error('Failed to create Shopify webhooks - aborting integration');
      return redirect('/dashboard/seller/integrations?error=webhook_creation_failed');
    }

    // Only save to database if webhooks were created successfully
    await integration.save();

    // Redirect to app UI immediately after authentication
    return redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?success=shopify_connected`);
      return redirect(`/dashboard/seller/integrations?success=shopify_connected`);
    }

  } catch (error) {
    console.error('Shopify callback error:', error);
    return redirect('/auth/connect-store?error=internal_error');
  }
}

async function handleInstallFlow(shop: string, accessToken: string, scope: string, storeInfo: any) {
  // Create webhooks for compliance
  await createShopifyWebhooks(shop, accessToken, 'pending');
  
  // Store install information for when user actually connects
  // You might want to store this in a separate table or cache
  console.log('App installed for shop:', shop);
}
async function createShopifyWebhooks(shop: string, accessToken: string, integrationId: string): Promise<boolean> {
  try {
    const baseWebhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/shopify`;
    
    // Mandatory compliance webhooks
    const mandatoryWebhooks = [
      'app/uninstalled',
      'customers/data_request',
      'customers/redact',
      'shop/redact'
    ];

    // Optional business webhooks
    const businessWebhooks = [
      'orders/create'
    ];

    let allWebhooksCreated = true;

    // Create mandatory compliance webhooks first
    for (const topic of mandatoryWebhooks) {
      const webhookResponse = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: `${baseWebhookUrl}?integrationId=${integrationId}&topic=${topic}`,
            format: 'json'
          }
        })
      });

      if (!webhookResponse.ok) {
        console.error(`Failed to create mandatory webhook ${topic}:`, webhookResponse.status);
        allWebhooksCreated = false;
      }
    }

    // Create business webhooks (optional - don't fail if these don't work)
    for (const topic of businessWebhooks) {
      const webhookResponse = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: `${baseWebhookUrl}?integrationId=${integrationId}&topic=${topic}`,
            format: 'json'
          }
        })
      });

      if (!webhookResponse.ok) {
        console.warn(`Failed to create business webhook ${topic}:`, webhookResponse.status);
        // Don't fail for business webhooks
      }
    }

    console.log('Successfully created Shopify webhooks');
    return allWebhooksCreated;
  } catch (error) {
    console.error('Failed to create Shopify webhooks:', error);
    return false;
  }
}
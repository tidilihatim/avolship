import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { generateWooCommerceWebhookSecret } from '@/lib/utils/woocommerce';

// Handle both GET and POST requests from WooCommerce
export async function GET(request: NextRequest) {
  return handleWooCommerceCallback(request);
}

export async function POST(request: NextRequest) {
  return handleWooCommerceCallback(request);
}

async function handleWooCommerceCallback(request: NextRequest) {
  try {
    // Handle POST request with API keys from WooCommerce
    if (request.method === 'POST') {
      return await handleWooCommerceAPIKeys(request);
    }

    // Handle GET request (user redirect after authorization)
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=unauthorized`);
    }

    const { searchParams } = new URL(request.url);
    
    // Log all parameters for debugging
    console.log('WooCommerce callback URL:', request.url);
    console.log('All searchParams:', Object.fromEntries(searchParams.entries()));
    
    const success = searchParams.get('success');
    const user_id = searchParams.get('user_id'); // This contains our state data
    
    if (success !== '1') {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=access_denied`);
    }

    if (!user_id) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=missing_parameters`);
    }

    // Validate state parameter (passed as user_id)
    const stateData = validateState(user_id);
    if (!stateData) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=invalid_state`);
    }

    // User authorization successful - WooCommerce will POST the API keys separately
    // Since the POST happens automatically, we can redirect to success immediately
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?success=woocommerce_connected`);
    
  } catch (error) {
    console.error('WooCommerce callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/seller/integrations?error=internal_error`);
  }
}

async function handleWooCommerceAPIKeys(request: NextRequest) {
  try {
    // Parse the JSON body that WooCommerce sends
    const body = await request.json();
    console.log('WooCommerce API keys received:', body);
    
    const { key_id, user_id, consumer_key, consumer_secret, key_permissions } = body;
    
    if (!consumer_key || !consumer_secret || !user_id) {
      console.error('Missing required fields in WooCommerce callback');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate state parameter (passed as user_id)
    const stateData = validateState(user_id);
    if (!stateData) {
      console.error('Invalid state in WooCommerce API keys callback');
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    // Use validated data from state
    const userId = stateData.userId;
    const warehouseId = stateData.warehouseId;
    const storeUrl = stateData.storeUrl;
    
    // Generate deterministic webhook secret using seller ID + static salt
    // This can be regenerated in webhook validation without storing in DB
    const webhookSecret = generateWooCommerceWebhookSecret(userId);
    
    console.log('Generated webhook secret for user_id:', user_id);
    
    // Save the integration with real API keys
    const integration = await saveWooCommerceTokens(userId, warehouseId, {
      consumer_key,
      consumer_secret,
      store_url: storeUrl,
      key_permissions: key_permissions || 'read_write',
      key_id: key_id
    });

    // Create webhooks using the new API keys and secret
    await createWooCommerceWebhooks(storeUrl, consumer_key, consumer_secret, webhookSecret, integration._id.toString(), userId, warehouseId);

    console.log('WooCommerce integration completed successfully');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error handling WooCommerce API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function saveWooCommerceTokens(userId: string, warehouseId: string, tokenData: any) {
  await connectToDatabase();
  
  try {
    const UserIntegration = (await import('@/lib/db/models/user-integration')).default;
    const { IntegrationMethod, IntegrationStatus } = await import('@/lib/db/models/user-integration');
    
    // Prepare connection data
    const connectionData = {
      consumerKey: tokenData.consumer_key,
      consumerSecret: tokenData.consumer_secret,
      storeUrl: tokenData.store_url,
      keyPermissions: tokenData.key_permissions,
      keyId: tokenData.key_id,
      webhookSubscriptions: []
    };
    
    // Check if integration already exists
    const existingIntegration = await UserIntegration.findOne({
      userId,
      warehouseId,
      platformId: 'woocommerce',
      integrationMethod: IntegrationMethod.DIRECT,
      isActive: true
    });
    
    let integration;
    
    if (existingIntegration) {
      // Update existing integration
      existingIntegration.connectionData = connectionData;
      existingIntegration.status = IntegrationStatus.CONNECTED;
      existingIntegration.lastSyncAt = new Date();
      integration = await existingIntegration.save();
      
      console.log('Updated existing WooCommerce integration for user:', userId);
    } else {
      // Create new integration
      integration = new UserIntegration({
        userId,
        warehouseId,
        platformId: 'woocommerce',
        integrationMethod: IntegrationMethod.DIRECT,
        status: IntegrationStatus.CONNECTED,
        connectionData,
        syncStats: {
          totalOrdersSynced: 0,
          syncErrors: 0
        }
      });
      
      integration = await integration.save();
      console.log('Created new WooCommerce integration for user:', userId);
    }
    
    return integration;
    
  } catch (error) {
    console.error('Error saving WooCommerce tokens:', error);
    throw error;
  }
}

async function createWooCommerceWebhooks(storeUrl: string, consumerKey: string, consumerSecret: string, webhookSecret: string, integrationId: string, userId: string, warehouseId: string) {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_SOCKET_URL}/api/webhooks/woocommerce?integrationId=${integrationId}`;
    
    console.log('Creating WooCommerce order webhook...');
    
    // WooCommerce REST API endpoint for webhooks
    const apiUrl = `https://${storeUrl}/wp-json/wc/v3/webhooks`;
    
    // Create webhook for order.created event
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
      },
      body: JSON.stringify({
        name: 'Avolship Order Webhook',
        topic: 'order.created',
        delivery_url: webhookUrl,
        secret: webhookSecret,
        status: 'active'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create webhook:', response.status, errorText);
      return [];
    }

    const webhookData = await response.json();
    const webhookSubscription = {
      event: 'order.created',
      id: webhookData.id,
      delivery_url: webhookUrl,
      createdAt: new Date()
    };

    console.log(`Successfully created WooCommerce webhook with ID: ${webhookData.id}`);

    // Update integration with webhook subscription
    const UserIntegration = (await import('@/lib/db/models/user-integration')).default;
    const { IntegrationMethod } = await import('@/lib/db/models/user-integration');
    
    await UserIntegration.findOneAndUpdate(
      {
        userId,
        warehouseId,
        platformId: 'woocommerce',
        integrationMethod: IntegrationMethod.DIRECT,
        isActive: true
      },
      {
        'connectionData.webhookSubscriptions': [webhookSubscription]
      }
    );

    console.log('Successfully created WooCommerce webhook');
    return [webhookSubscription];
    
  } catch (error) {
    console.error('Failed to create WooCommerce webhooks:', error);
    return [];
  }
}


function validateState(state: string): { userId: string; warehouseId: string; storeUrl: string } | null {
  try {
    const decoded = Buffer.from(state, 'base64').toString();
    const [userId, warehouseId, storeUrl, timestamp] = decoded.split(':');
    
    // Check if state is not older than 10 minutes
    const stateTime = parseInt(timestamp);
    const now = Date.now();
    if (now - stateTime > 10 * 60 * 1000) {
      return null;
    }
    
    return { userId, warehouseId, storeUrl };
  } catch {
    return null;
  }
}


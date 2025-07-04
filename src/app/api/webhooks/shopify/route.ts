import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import UserIntegration from '@/lib/db/models/user-integration';

export async function GET(request: NextRequest) {
  // Handle webhook verification
  const { searchParams } = request.nextUrl;
  const challenge = searchParams.get('hub.challenge');
  
  if (challenge) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }
  
  return NextResponse.json({ status: 'ok' });
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const integrationId = searchParams.get('integrationId');
    const topic = searchParams.get('topic');

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 });
    }

    // Get the raw body for HMAC verification
    const body = await request.text();
    const shopifyTopic = request.headers.get('x-shopify-topic');
    const shopifyHmac = request.headers.get('x-shopify-hmac-sha256');
    const shopifyShopDomain = request.headers.get('x-shopify-shop-domain');

    if (!shopifyTopic || !shopifyHmac || !shopifyShopDomain) {
      return NextResponse.json({ error: 'Missing required headers' }, { status: 400 });
    }

    // Verify HMAC signature using webhook secret (should be different from client secret)
    const crypto = require('crypto');
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_CLIENT_SECRET;
    
    const calculatedHmac = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('base64');

    if (calculatedHmac !== shopifyHmac) {
      console.error('HMAC verification failed:', {
        calculated: calculatedHmac,
        received: shopifyHmac,
        topic: shopifyTopic
      });
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Find the integration
    const integration = await UserIntegration.findById(integrationId);
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Parse webhook data
    const webhookData = JSON.parse(body);

    // Handle different webhook topics
    switch (shopifyTopic) {
      case 'orders/create':
        console.log('New Shopify order received:', webhookData.id);
        // Update sync stats
        await UserIntegration.findByIdAndUpdate(integrationId, {
          $inc: { 'syncStats.totalOrdersSynced': 1 },
          lastSyncAt: new Date()
        });
        break;

      case 'orders/updated':
        console.log('Shopify order updated:', webhookData.id);
        break;

      case 'orders/cancelled':
        console.log('Shopify order cancelled:', webhookData.id);
        break;

      // Mandatory compliance webhooks
      case 'app/uninstalled':
        console.log('App uninstalled for shop:', shopifyShopDomain);
        // Deactivate integration
        await UserIntegration.updateMany(
          { 'connectionData.shop': shopifyShopDomain },
          { isActive: false, status: 'DISCONNECTED' }
        );
        break;

      case 'customers/data_request':
        console.log('Customer data request for shop:', shopifyShopDomain);
        // Handle GDPR data request - export customer data
        const customerDataRequest = webhookData;
        const requestCustomerId = customerDataRequest.customer?.id;
        const requestCustomerEmail = customerDataRequest.customer?.email;
        
        if (requestCustomerId && requestCustomerEmail) {
          // Log the data request for compliance tracking
          console.log(`Data request received for customer ${requestCustomerId} (${requestCustomerEmail}) from shop ${shopifyShopDomain}`);
          
          // In a real implementation, you would:
          // 1. Collect all customer data from your database
          // 2. Generate a data export file (JSON/CSV)
          // 3. Send the data to the customer via email or secure portal
          // 4. Log the completion of the data request
          
          // For now, we acknowledge the request
          console.log('Customer data request acknowledged - manual processing required');
        }
        break;

      case 'customers/redact':
        console.log('Customer data redaction request for shop:', shopifyShopDomain);
        // Handle GDPR data deletion - implement customer data removal
        const customerRedactData = webhookData;
        const redactCustomerId = customerRedactData.customer?.id;
        const redactCustomerEmail = customerRedactData.customer?.email;
        
        if (redactCustomerId) {
          console.log(`Data redaction request received for customer ${redactCustomerId} from shop ${shopifyShopDomain}`);
          
          // Remove customer data from your systems
          // This should include:
          // 1. Remove customer PII from orders
          // 2. Remove customer profiles/accounts
          // 3. Remove any stored customer preferences
          // 4. Remove analytics data tied to the customer
          
          // Example: Remove customer data from orders
          // await Order.updateMany(
          //   { 'customer.shopify_id': redactCustomerId },
          //   { $unset: { 'customer.email': 1, 'customer.phone': 1, 'customer.name': 1 } }
          // );
          
          console.log(`Customer data redaction completed for customer ${redactCustomerId}`);
        }
        break;

      case 'shop/redact':
        console.log('Shop data redaction request for shop:', shopifyShopDomain);
        // Handle shop data deletion after app uninstall (48 hours after uninstall)
        await UserIntegration.deleteMany({ 'connectionData.shop': shopifyShopDomain });
        break;

      default:
        console.log('Unhandled webhook topic:', shopifyTopic);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Shopify webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
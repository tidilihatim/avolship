// app/api/install/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const shop = searchParams.get('shop');
    const hmac = searchParams.get('hmac');
    const timestamp = searchParams.get('timestamp');
    const host = searchParams.get('host');

    console.log('Install request received:', { shop, hmac, timestamp, host });

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
    }

    // Verify HMAC (important for security)
    if (hmac && timestamp) {
      const query = new URLSearchParams(searchParams);
      query.delete('hmac');
      query.delete('signature');
      
      const message = query.toString();
      const providedHmac = hmac;
      const generatedHash = crypto
        .createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET!)
        .update(message)
        .digest('hex');

      const providedHashBuffer = Buffer.from(providedHmac, 'hex');
      const generatedHashBuffer = Buffer.from(generatedHash, 'hex');

      if (!crypto.timingSafeEqual(providedHashBuffer, generatedHashBuffer)) {
        return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
      }
    }

    // Clean shop domain
    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Check if app is already installed for this shop
    const isInstalled = await checkIfAppInstalled(cleanShop);
    
    if (isInstalled) {
      // App is already installed, redirect to app interface
      return redirect(`/dashboard/seller/integrations?shop=${cleanShop}`);
    } else {
      // App not installed, initiate OAuth
      return redirect(`/api/integrations/shopify/auth?shop=${cleanShop}`);
    }

  } catch (error) {
    console.error('Install handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkIfAppInstalled(shop: string): Promise<boolean> {
  try {
    // Check your database to see if this shop has an active integration
    const { connectToDatabase } = await import('@/lib/db/mongoose');
    const { default: UserIntegration } = await import('@/lib/db/models/user-integration');
    
    await connectToDatabase();
    
    const integration = await UserIntegration.findOne({
      'connectionData.shop': shop,
      isActive: true,
      status: 'connected'
    });
    
    return !!integration;
  } catch (error) {
    console.error('Error checking app installation:', error);
    return false;
  }
}
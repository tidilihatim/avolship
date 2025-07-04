// app/api/integrations/shopify/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const shop = searchParams.get('shop');
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
    }

    // Clean shop domain
    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (!cleanShop.endsWith('.myshopify.com')) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // For install flow, we'll use a temporary state since we don't have user session yet
    const state = generateInstallState(cleanShop);
    
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/shopify/callback`;
    
    // Required Shopify OAuth scopes
    const scopes = [
      'read_orders',
      'write_orders', 
      'read_products',
      'write_products',
      'read_fulfillments',
      'write_fulfillments',
    ].join(',');

    // Shopify OAuth authorization URL  
    const authUrl = `https://${cleanShop}/admin/oauth/authorize?` +
      `client_id=${encodeURIComponent(process.env.SHOPIFY_CLIENT_ID || '')}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;

    // Redirect to Shopify OAuth
    return Response.redirect(authUrl);
    
  } catch (error) {
    console.error('Shopify auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateInstallState(shop: string): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(7);
  return Buffer.from(`install:${shop}:${timestamp}:${random}`).toString('base64');
}
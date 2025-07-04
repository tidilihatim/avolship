import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeUrl, warehouseId } = body;
    
    if (!storeUrl) {
      return NextResponse.json({ error: 'Store URL is required' }, { status: 400 });
    }

    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Clean shop domain
    let cleanShop = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // If it's not a .myshopify.com domain, convert it
    if (!cleanShop.endsWith('.myshopify.com')) {
      // Extract the store name from custom domain
      const storeName = cleanShop.split('.')[0];
      cleanShop = `${storeName}.myshopify.com`;
    }

    // Generate state with actual user ID
    const state = generateUserState(session.user.id, warehouseId || '', cleanShop);
    
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

    // Return the auth URL for frontend to redirect
    return NextResponse.json({ authUrl });
    
  } catch (error) {
    console.error('Shopify auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateUserState(userId: string, warehouseId: string, shop: string): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(7);
  return Buffer.from(`user:${userId}:${warehouseId}:${shop}:${timestamp}:${random}`).toString('base64');
}
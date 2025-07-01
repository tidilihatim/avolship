import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeUrl } = await request.json();
    
    if (!storeUrl) {
      return NextResponse.json({ error: 'Store URL is required' }, { status: 400 });
    }

    // Get warehouse ID from cookies
    const { cookies } = await import('next/headers');
    const cookiesStore = await cookies();
    const warehouseId = cookiesStore.get('selectedWarehouse')?.value;
    
    if (!warehouseId) {
      return NextResponse.json({ 
        error: 'No warehouse selected. Please select a warehouse first.' 
      }, { status: 400 });
    }

    // Clean up URL
    const cleanUrl = storeUrl.replace(/\/$/, '').replace(/^https?:\/\//, '');
    
    // Generate state parameter for security (include store URL)
    const state = generateState(session.user.id, warehouseId, cleanUrl);
    
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/woocommerce/callback`;
    
    // WooCommerce OAuth authorization URL  
    const authUrl = `https://${cleanUrl}/wc-auth/v1/authorize?` +
      `app_name=${encodeURIComponent('Avolship')}` +
      `&scope=read_write` +
      `&user_id=${encodeURIComponent(state)}` +
      `&return_url=${encodeURIComponent(redirectUri)}` +
      `&callback_url=${encodeURIComponent(redirectUri)}`;

    return NextResponse.json({ authUrl });
    
  } catch (error) {
    console.error('WooCommerce authorize error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateState(userId: string, warehouseId: string, storeUrl: string): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(7);
  return Buffer.from(`${userId}:${warehouseId}:${storeUrl}:${timestamp}:${random}`).toString('base64');
}
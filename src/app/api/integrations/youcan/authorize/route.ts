import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.YOUCAN_CLIENT_ID;
    const clientSecret = process.env.YOUCAN_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/youcan/callback`;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'YouCan OAuth credentials not configured',
        details: { hasClientId: !!clientId, hasClientSecret: !!clientSecret }
      }, { status: 500 });
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

    // Generate state parameter for security (including warehouse ID)
    const state = generateState(session.user.id, warehouseId);
    
    // YouCan OAuth authorization URL
    const authUrl = new URL('https://seller-area.youcan.shop/admin/oauth/authorize');
    authUrl.searchParams.set('scope', 'read-rest-hooks edit-rest-hooks delete-rest-hooks'); // Only REST hooks permissions
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateState(userId: string, warehouseId: string): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(7);
  return Buffer.from(`${userId}:${warehouseId}:${timestamp}:${random}`).toString('base64');
}
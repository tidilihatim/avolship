import { redirect } from 'next/navigation';

interface InstallPageProps {
  searchParams: Promise<{
    shop?: string;
    host?: string;
    hmac?: string;
    timestamp?: string;
  }>;
}

export default async function InstallPage({ searchParams }: InstallPageProps) {
  const { shop } = await searchParams;
  
  if (shop) {
    // Server-side redirect to Shopify OAuth
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/shopify/callback`;
    const scopes = 'read_orders,write_orders,read_products,write_products,read_fulfillments,write_fulfillments,write_webhooks';
    const state = Buffer.from(`install:${shop}:${Date.now()}`).toString('base64');
    
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId || '')}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;
    
    redirect(authUrl);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[#1c2d51] mb-2">Installation Error</h2>
        <p className="text-gray-600">Shop parameter is missing. Please try again.</p>
      </div>
    </div>
  );
}
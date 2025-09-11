'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Store, ArrowRight, Loader2 } from 'lucide-react';

export default function ShopifyCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopInfo, setShopInfo] = useState<any>(null);
  
  const shop = searchParams.get('shop');
  const integrationId = searchParams.get('id');

  useEffect(() => {
    if (shop) {
      // Extract shop name for display
      const shopName = shop.replace('.myshopify.com', '');
      setShopInfo({ name: shopName, domain: shop });
    }
  }, [shop]);

  const handleCompleteSetup = async () => {
    if (!session?.user?.id) {
      setError('User session not found');
      return;
    }

    if (!integrationId) {
      setError('Missing integration ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/shopify/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete setup');
      }

      // Success - redirect to integrations page
      router.push('/dashboard/seller/integrations?success=shopify_connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <CardTitle>Shopify App Installed Successfully!</CardTitle>
          <CardDescription>
            Complete the setup to start receiving orders from your Shopify store
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {shopInfo && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{shopInfo.name}</p>
                  <p className="text-xs text-muted-foreground">{shopInfo.domain}</p>
                </div>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">What happens next:</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>App installed and authorized</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Webhooks configured for order sync</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span>Complete setup to start receiving orders</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-center py-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleCompleteSetup} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Setup...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/seller/integrations')} 
              className="w-full"
            >
              Back to Integrations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
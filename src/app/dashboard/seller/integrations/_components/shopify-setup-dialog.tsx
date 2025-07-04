'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Zap, FileSpreadsheet, CheckCircle, Clock, Loader2, Store } from 'lucide-react';
import { getPlatformIntegrationMethods } from '@/app/actions/integrations';

interface ShopifySetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShopifySetupDialog({ open, onClose }: ShopifySetupDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<'direct' | 'sheets' | null>(null);
  const [integrationMethods, setIntegrationMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    if (open) {
      fetchIntegrationMethods();
      setSelectedMethod(null);
      setStoreUrl('');
      setShowCredentials(false);
      setError(null);
    }
  }, [open]);

  async function fetchIntegrationMethods() {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPlatformIntegrationMethods('shopify');
      if (result.success && result.data) {
        const methodsWithDetails = result.data.methods.map((method: any) => ({
          ...method,
          icon: method.id === 'direct' ? Zap : FileSpreadsheet,
          isRecommended: method.id === 'direct',
          pros: method.id === 'direct' 
            ? ['Fastest setup', 'Zero maintenance', 'Most reliable']
            : ['Full control', 'Custom formatting', 'No API access needed'],
          cons: method.id === 'direct'
            ? ['Requires Shopify store admin access']
            : ['Manual entry required', 'Possible delays']
        }));
        setIntegrationMethods(methodsWithDetails);
      } else {
        setError(result.error || 'Failed to load integration methods');
      }
    } catch (err) {
      setError('Failed to load integration methods');
    } finally {
      setLoading(false);
    }
  }

  const handleMethodSelect = async (method: 'direct' | 'sheets') => {
    setSelectedMethod(method);
    
    if (method === 'direct') {
      setShowCredentials(true);
    } else {
      // Show Google Sheets setup
      // We'll implement this next
    }
  };

  const handleDirectIntegration = async () => {
    if (!storeUrl.trim()) {
      setError('Please enter your Shopify store URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call our authorize endpoint to get the auth URL
      const response = await fetch('/api/integrations/shopify/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeUrl: storeUrl.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start authorization');
      }

      // Redirect to Shopify authorization
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start authorization');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-none !w-[90vw] sm:!w-[85vw] lg:!w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            Connect Shopify Store
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showCredentials && (
            <>
              <div className="text-center">
                <p className="text-muted-foreground">
                  Choose how you want to connect your Shopify store to receive orders
                </p>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-muted-foreground">Loading integration methods...</span>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-destructive">{error}</p>
                  <Button variant="outline" onClick={fetchIntegrationMethods} className="mt-4">
                    Try Again
                  </Button>
                </div>
              )}

              {!loading && !error && (
                <>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {integrationMethods.map((method) => {
                      const IconComponent = method.icon;
                      
                      return (
                        <Card 
                          key={method.id}
                          className={`relative cursor-pointer transition-all hover:shadow-md ${
                            selectedMethod === method.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedMethod(method.id as 'direct' | 'sheets')}
                        >
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                  <IconComponent className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{method.name}</CardTitle>
                                  {method.isRecommended && (
                                    <Badge variant="default" className="mt-1 text-xs">
                                      Recommended
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {method.setupTime}
                              </div>
                            </div>
                            <CardDescription className="text-sm">
                              {method.description}
                            </CardDescription>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Features:</p>
                              {method.features.map((feature: string, index: number) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span className="text-muted-foreground">{feature}</span>
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-green-600 mb-1">Pros</p>
                                {method.pros.map((pro: string, index: number) => (
                                  <p key={index} className="text-xs text-muted-foreground">• {pro}</p>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-orange-600 mb-1">Considerations</p>
                                {method.cons.map((con: string, index: number) => (
                                  <p key={index} className="text-xs text-muted-foreground">• {con}</p>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      disabled={!selectedMethod}
                      onClick={() => selectedMethod && handleMethodSelect(selectedMethod)}
                    >
                      Continue with {selectedMethod === 'direct' ? 'Direct Integration' : 'Google Sheets'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {showCredentials && selectedMethod === 'direct' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Connect Your Shopify Store</h3>
                <p className="text-muted-foreground mt-2">
                  Enter your store URL to automatically set up the integration
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Store Information</CardTitle>
                  <CardDescription>
                    We'll automatically create a private app and webhooks for your store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeUrl">Shopify Store URL</Label>
                    <Input
                      id="storeUrl"
                      type="text"
                      placeholder="mystore.myshopify.com"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your Shopify store domain (e.g., mystore.myshopify.com)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="text-center py-4">
                  <p className="text-destructive">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCredentials(false)} disabled={loading}>
                  Back
                </Button>
                <Button onClick={handleDirectIntegration} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Store
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
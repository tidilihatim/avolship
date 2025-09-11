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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('shopifySetup');

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
        setError(result.error || t('errorLoading'));
      }
    } catch (err) {
      setError(t('errorLoading'));
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
                <h3 className="text-lg font-semibold">Install Avolship App on Shopify</h3>
                <p className="text-muted-foreground mt-2">
                  Install our app directly from your Shopify Admin to connect your store
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Installation Steps</CardTitle>
                  <CardDescription>
                    Follow these steps to install the Avolship app on your Shopify store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        1
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Go to your Shopify Admin</p>
                        <p className="text-xs text-muted-foreground">
                          Navigate to your store's admin panel
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        2
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Find & Install Avolship App</p>
                        <p className="text-xs text-muted-foreground">
                          Go to Apps → Visit Shopify App Store → Search "Avolship"
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        3
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Complete Installation</p>
                        <p className="text-xs text-muted-foreground">
                          Click "Install app" and authorize the required permissions
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-medium">
                        ✓
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Setup Complete</p>
                        <p className="text-xs text-muted-foreground">
                          You'll be redirected back here to complete the connection
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-muted/50 border border-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-4 rounded-full bg-primary" />
                  <p className="text-sm font-medium">Alternative: Development Testing</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  For testing purposes, you can also install directly using this link from your Shopify Admin
                </p>
                <div className="space-y-2">
                  <Label htmlFor="testStoreUrl" className="text-xs">Your Store Domain (for testing only)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="testStoreUrl"
                      type="text"
                      placeholder="yourstore.myshopify.com"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => {
                        if (storeUrl.trim()) {
                          const cleanUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
                          window.open(`https://${cleanUrl}/admin/apps`, '_blank');
                        }
                      }}
                      disabled={!storeUrl.trim()}
                    >
                      Open Admin
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-center py-4">
                  <p className="text-destructive">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCredentials(false)} disabled={loading}>
                  Back
                </Button>
                <Button variant="outline" onClick={onClose}>
                  I'll Install Later
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
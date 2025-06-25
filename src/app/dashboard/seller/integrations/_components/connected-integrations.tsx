'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Pause, Play, ExternalLink, Calendar } from 'lucide-react';
import { disconnectIntegration } from '@/app/actions/integrations';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ConnectedIntegrationsProps {
  integrations: any[];
  warehouseId: string;
}

export function ConnectedIntegrations({ integrations, warehouseId }: ConnectedIntegrationsProps) {
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDisconnect = async (integrationId: string, platformName: string) => {
    setDisconnectingId(integrationId);
    
    try {
      const result = await disconnectIntegration(integrationId);
      
      if (result.success) {
        toast.success(`${platformName} integration disconnected successfully`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to disconnect integration');
      }
    } catch (error) {
      toast.error('An error occurred while disconnecting');
    } finally {
      setDisconnectingId(null);
    }
  };

  const getPlatformName = (platformId: string) => {
    switch (platformId) {
      case 'youcan': return 'YouCan';
      case 'shopify': return 'Shopify';
      case 'woocommerce': return 'WooCommerce';
      default: return platformId;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'direct': return 'Direct Integration';
      case 'google_sheets': return 'Google Sheets';
      default: return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Connected Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Manage your active e-commerce platform connections
        </p>
      </div>

      <div className="grid gap-4">
        {integrations.map((integration) => (
          <Card key={integration._id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-base">
                      {getPlatformName(integration.platformId)}
                    </CardTitle>
                    <Badge className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={integration.status === 'connected'}
                    disabled={integration.status !== 'connected'}
                  />
                </div>
              </div>
              <CardDescription className="flex items-center space-x-4 text-xs">
                <span>{getMethodName(integration.integrationMethod)}</span>
                {integration.connectionData?.storeName && (
                  <>
                    <span>•</span>
                    <span>{integration.connectionData.storeName}</span>
                  </>
                )}
                {integration.connectionData?.storeUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => window.open(integration.connectionData.storeUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit Store
                  </Button>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Connected {new Date(integration.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span>Orders: {integration.syncStats?.totalOrdersSynced || 0}</span>
                  </div>
                  {integration.syncStats?.syncErrors > 0 && (
                    <div className="text-red-600">
                      <span>Errors: {integration.syncStats.syncErrors}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={integration.status !== 'connected'}
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={disconnectingId === integration._id}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to disconnect your {getPlatformName(integration.platformId)} integration?
                          This will stop all order syncing and remove webhooks. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDisconnect(integration._id, getPlatformName(integration.platformId))}
                          disabled={disconnectingId === integration._id}
                        >
                          {disconnectingId === integration._id ? 'Disconnecting...' : 'Disconnect'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
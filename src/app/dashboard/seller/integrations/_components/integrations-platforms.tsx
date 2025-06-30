'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MoreVertical } from 'lucide-react';
import { pauseIntegration, resumeIntegration, disconnectIntegration } from '@/app/actions/integrations';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface Platform {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  status: string;
  features: string[];
}

interface IntegrationsPlatformsProps {
  platforms: any;
  userIntegrations: any[];
  onPlatformSelect: (platform: string) => void;
  onIntegrationUpdate?: () => void;
}

export function IntegrationsPlatforms({ platforms, userIntegrations, onPlatformSelect, onIntegrationUpdate }: IntegrationsPlatformsProps) {
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [disconnectDialog, setDisconnectDialog] = useState<{
    open: boolean;
    integration: any;
    platformName: string;
  }>({
    open: false,
    integration: null,
    platformName: ''
  });
  const router = useRouter();
  // Handle the platforms data structure
  const platformsData = platforms?.success ? platforms.data : [];
  
  // Create a map of connected integrations by platform ID
  const connectedIntegrations = userIntegrations.reduce((acc, integration) => {
    acc[integration.platformId] = integration;
    return acc;
  }, {} as Record<string, any>);

  const handlePauseIntegration = async (integrationId: string, platformName: string) => {
    setLoadingActions(prev => ({ ...prev, [integrationId]: true }));
    try {
      const result = await pauseIntegration(integrationId);
      if (result.success) {
        toast.success(`${platformName} integration paused successfully`);
        onIntegrationUpdate?.();
      } else {
        toast.error(result.error || 'Failed to pause integration');
      }
    } catch (error) {
      toast.error('Failed to pause integration');
    } finally {
      setLoadingActions(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const handleResumeIntegration = async (integrationId: string, platformName: string) => {
    setLoadingActions(prev => ({ ...prev, [integrationId]: true }));
    try {
      const result = await resumeIntegration(integrationId);
      if (result.success) {
        toast.success(`${platformName} integration resumed successfully`);
        onIntegrationUpdate?.();
      } else {
        toast.error(result.error || 'Failed to resume integration');
      }
    } catch (error) {
      toast.error('Failed to resume integration');
    } finally {
      setLoadingActions(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const handleDisconnectClick = (integration: any, platformName: string) => {
    setDisconnectDialog({
      open: true,
      integration,
      platformName
    });
  };

  const handleDisconnectIntegration = async () => {
    const { integration, platformName } = disconnectDialog;
    setLoadingActions(prev => ({ ...prev, [integration._id]: true }));
    setDisconnectDialog({ open: false, integration: null, platformName: '' });
    
    try {
      const result = await disconnectIntegration(integration._id);
      if (result.success) {
        toast.success(`${platformName} integration disconnected successfully`);
        onIntegrationUpdate?.();
      } else {
        toast.error(result.error || 'Failed to disconnect integration');
      }
    } catch (error) {
      toast.error('Failed to disconnect integration');
    } finally {
      setLoadingActions(prev => ({ ...prev, [integration._id]: false }));
    }
  };

  if (!platformsData || platformsData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No platforms available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Available Platforms</h2>
        <p className="text-sm text-muted-foreground">
          Choose your e-commerce platform to get started
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platformsData.map((platform: Platform) => {
          const integration = connectedIntegrations[platform.id];
          const isConnected = !!integration;
          
          return (
            <Card 
              key={platform.id}
              className={`relative transition-all hover:shadow-md ${
                platform.status === 'available' && !isConnected ? 'cursor-pointer' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <img 
                        src={platform.iconPath} 
                        alt={`${platform.name} icon`}
                        className="h-6 w-6" 
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{platform.name}</CardTitle>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      isConnected 
                        ? integration.status === 'paused' ? 'secondary' : 'default'
                        : platform.status === 'available' 
                          ? 'outline' 
                          : 'secondary'
                    }
                    className="text-xs"
                  >
                    {isConnected 
                      ? integration.status === 'paused' ? 'Paused' : 'Connected'
                      : platform.status === 'available' 
                        ? 'Available' 
                        : 'Coming Soon'
                    }
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {platform.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {platform.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {isConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Connected {new Date(integration.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <span>Orders: {integration.syncStats?.totalOrdersSynced || 0}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => router.push(`/dashboard/seller/integrations/logs/${integration._id}`)}
                            >
                              View Logs
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {integration.status === 'connected' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          disabled={loadingActions[integration._id]}
                          onClick={() => handlePauseIntegration(integration._id, platform.name)}
                        >
                          {loadingActions[integration._id] ? 'Pausing...' : 'Pause'}
                        </Button>
                      ) : integration.status === 'paused' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          disabled={loadingActions[integration._id]}
                          onClick={() => handleResumeIntegration(integration._id, platform.name)}
                        >
                          {loadingActions[integration._id] ? 'Resuming...' : 'Resume'}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          disabled={true}
                        >
                          Unavailable
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={loadingActions[integration._id]}
                        onClick={() => handleDisconnectClick(integration, platform.name)}
                      >
                        {loadingActions[integration._id] ? 'Disconnecting...' : 'Disconnect'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant={platform.status === 'available' ? 'default' : 'secondary'}
                    className="w-full"
                    disabled={platform.status !== 'available'}
                    onClick={() => platform.status === 'available' && onPlatformSelect(platform.id)}
                  >
                    {platform.status === 'available' ? (
                      <>
                        Connect {platform.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Coming Soon'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialog.open} onOpenChange={(open) => 
        setDisconnectDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {disconnectDialog.platformName} Integration</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>Are you sure you want to disconnect this integration? This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Permanently delete the integration connection</li>
                <li>Stop all automatic order syncing</li>
                <li>Remove all webhook subscriptions</li>
                <li>Delete all stored connection data</li>
                <li>Clear sync statistics and history</li>
              </ul>
              <p className="text-sm font-medium text-orange-600">
                You will need to reconnect and reconfigure if you want to use this integration again.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDisconnectDialog({ open: false, integration: null, platformName: '' })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisconnectIntegration}
              disabled={loadingActions[disconnectDialog.integration?._id]}
            >
              {loadingActions[disconnectDialog.integration?._id] ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
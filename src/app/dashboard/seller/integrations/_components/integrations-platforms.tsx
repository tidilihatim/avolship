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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('integrations.platforms');
  const tActions = useTranslations('integrations.platforms.actions');
  const tDisconnect = useTranslations('integrations.disconnect');
  const tMessages = useTranslations('integrations.messages');
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
        toast.success(tMessages('success.paused', { platform: platformName }));
        onIntegrationUpdate?.();
      } else {
        toast.error(result.error || tMessages('errors.pauseFailed'));
      }
    } catch (error) {
      toast.error(tMessages('errors.pauseFailed'));
    } finally {
      setLoadingActions(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const handleResumeIntegration = async (integrationId: string, platformName: string) => {
    setLoadingActions(prev => ({ ...prev, [integrationId]: true }));
    try {
      const result = await resumeIntegration(integrationId);
      if (result.success) {
        toast.success(tMessages('success.resumed', { platform: platformName }));
        onIntegrationUpdate?.();
      } else {
        toast.error(result.error || tMessages('errors.resumeFailed'));
      }
    } catch (error) {
      toast.error(tMessages('errors.resumeFailed'));
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
        toast.success(tMessages('success.disconnected', { platform: platformName }));
        onIntegrationUpdate?.();
      } else {
        toast.error(result.error || tMessages('errors.disconnectFailed'));
      }
    } catch (error) {
      toast.error(tMessages('errors.disconnectFailed'));
    } finally {
      setLoadingActions(prev => ({ ...prev, [integration._id]: false }));
    }
  };

  if (!platformsData || platformsData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('noPlatforms')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
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
                      ? integration.status === 'paused' ? t('status.paused') : t('status.connected')
                      : platform.status === 'available' 
                        ? t('status.available') 
                        : t('status.comingSoon')
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
                      <span>{t('stats.connected', { date: new Date(integration.createdAt).toLocaleDateString() })}</span>
                      <div className="flex items-center gap-2">
                        <span>{t('stats.orders', { count: integration.syncStats?.totalOrdersSynced || 0 })}</span>
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
                              {tActions('viewLogs')}
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
                          {loadingActions[integration._id] ? tActions('pausing') : tActions('pause')}
                        </Button>
                      ) : integration.status === 'paused' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          disabled={loadingActions[integration._id]}
                          onClick={() => handleResumeIntegration(integration._id, platform.name)}
                        >
                          {loadingActions[integration._id] ? tActions('resuming') : tActions('resume')}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          disabled={true}
                        >
                          {tActions('unavailable')}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={loadingActions[integration._id]}
                        onClick={() => handleDisconnectClick(integration, platform.name)}
                      >
                        {loadingActions[integration._id] ? tActions('disconnecting') : tActions('disconnect')}
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
                        {tActions('connect', { platform: platform.name })}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      t('status.comingSoon')
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
            <DialogTitle>{tDisconnect('title', { platform: disconnectDialog.platformName })}</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>{tDisconnect('description')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Permanently delete the integration connection</li>
                <li>Stop all automatic order syncing</li>
                <li>Remove all webhook subscriptions</li>
                <li>Delete all stored connection data</li>
                <li>Clear sync statistics and history</li>
              </ul>
              <p className="text-sm font-medium text-orange-600">
                {tDisconnect('warning')}
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDisconnectDialog({ open: false, integration: null, platformName: '' })}
            >
              {tDisconnect('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisconnectIntegration}
              disabled={loadingActions[disconnectDialog.integration?._id]}
            >
              {loadingActions[disconnectDialog.integration?._id] ? tActions('disconnecting') : tDisconnect('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
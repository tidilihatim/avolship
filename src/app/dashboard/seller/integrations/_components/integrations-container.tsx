'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IntegrationsHeader } from './integrations-header';
import { IntegrationsPlatforms } from './integrations-platforms';
import { YouCanSetupDialog } from './youcan-setup-dialog';
import { WooCommerceSetupDialog } from './woocommerce-setup-dialog';
import { ShopifySetupDialog } from './shopify-setup-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface IntegrationsContainerProps {
  platforms: any;
  userIntegrations: any[];
  warehouseId: string;
  error?: string;
  success?: string;
}

export function IntegrationsContainer({ 
  platforms, 
  userIntegrations, 
  warehouseId, 
  error, 
  success
}: IntegrationsContainerProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('integrations.messages');

  const handleIntegrationUpdate = () => {
    router.refresh();
  };

  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
  };

  const handleDialogClose = () => {
    setSelectedPlatform(null);
  };

  // Clear URL params after showing alerts
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        router.replace('/dashboard/seller/integrations', { scroll: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, router]);

  return (
    <div className="space-y-6">
      <IntegrationsHeader />

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {getErrorMessage(error, t)}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {getSuccessMessage(success, t)}
          </AlertDescription>
        </Alert>
      )}

      {/* All Platforms (Available and Connected) */}
      <IntegrationsPlatforms 
        platforms={platforms}
        userIntegrations={userIntegrations}
        onPlatformSelect={handlePlatformSelect}
        onIntegrationUpdate={handleIntegrationUpdate}
      />
      
      <YouCanSetupDialog 
        open={selectedPlatform === 'youcan'}
        onClose={handleDialogClose}
      />
      
      <WooCommerceSetupDialog 
        open={selectedPlatform === 'woocommerce'}
        onClose={handleDialogClose}
      />
      
      <ShopifySetupDialog 
        open={selectedPlatform === 'shopify'}
        onClose={handleDialogClose}
      />
    </div>
  );
}

function getErrorMessage(error: string, t: any): string {
  switch (error) {
    case 'access_denied':
      return t('errors.accessDenied');
    case 'missing_parameters':
      return t('errors.missingParameters');
    case 'invalid_state':
      return t('errors.invalidState');
    case 'token_exchange_failed':
      return t('errors.tokenExchangeFailed');
    case 'internal_error':
      return t('errors.internalError');
    default:
      return t('errors.defaultError');
  }
}

function getSuccessMessage(success: string, t: any): string {
  switch (success) {
    case 'youcan_connected':
      return t('success.youcanConnected');
    case 'woocommerce_connected':
      return t('success.woocommerceConnected');
    case 'shopify_connected':
      return t('success.shopifyConnected');
    default:
      return t('success.defaultConnected');
  }
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IntegrationsHeader } from './integrations-header';
import { IntegrationsPlatforms } from './integrations-platforms';
import { YouCanSetupDialog } from './youcan-setup-dialog';
import { WooCommerceSetupDialog } from './woocommerce-setup-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

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
            {getErrorMessage(error)}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {getSuccessMessage(success)}
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
    </div>
  );
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'access_denied':
      return 'Access was denied. Please try again and allow the required permissions.';
    case 'missing_parameters':
      return 'Invalid authorization request. Please try again.';
    case 'invalid_state':
      return 'Security validation failed. Please try again.';
    case 'token_exchange_failed':
      return 'Failed to connect to YouCan. Please check your credentials and try again.';
    case 'internal_error':
      return 'An internal error occurred. Please try again later.';
    default:
      return 'An error occurred during integration setup. Please try again.';
  }
}

function getSuccessMessage(success: string): string {
  switch (success) {
    case 'youcan_connected':
      return 'YouCan integration connected successfully! Orders will now sync automatically.';
    case 'woocommerce_connected':
      return 'WooCommerce integration connected successfully! Orders will now sync automatically.';
    default:
      return 'Integration connected successfully!';
  }
}
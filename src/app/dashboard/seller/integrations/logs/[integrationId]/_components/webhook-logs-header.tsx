'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WebhookLogsHeaderProps {
  integrationId: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export function WebhookLogsHeader({ integrationId, onRefresh, loading }: WebhookLogsHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Webhook Logs</h1>
            <p className="text-sm text-muted-foreground">
              Integration ID: {integrationId}
            </p>
          </div>
        </div>
        
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Retention Policy:</strong> Webhook logs are automatically retained for 30 days from their creation date. 
          After this period, logs are permanently deleted to optimize system performance and comply with data management policies.
        </AlertDescription>
      </Alert>
    </div>
  );
}
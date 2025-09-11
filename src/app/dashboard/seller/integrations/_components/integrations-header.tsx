'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';


export function IntegrationsHeader() {
  const t = useTranslations('integrations');
  const tHeader = useTranslations('integrations.header');
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{tHeader('automateTitle')}</CardTitle>
            <Badge variant="secondary">{tHeader('betaLabel')}</Badge>
          </div>
          <CardDescription>
            {tHeader('automateDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <div className="h-2 w-2 rounded-full bg-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{tHeader('features.realTimeSync.title')}</p>
                <p className="text-xs text-muted-foreground">{tHeader('features.realTimeSync.description')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{tHeader('features.autoFulfillment.title')}</p>
                <p className="text-xs text-muted-foreground">{tHeader('features.autoFulfillment.description')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                <div className="h-2 w-2 rounded-full bg-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{tHeader('features.multiPlatform.title')}</p>
                <p className="text-xs text-muted-foreground">{tHeader('features.multiPlatform.description')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>{tHeader('warehouseInfo.title')}</strong> {tHeader('warehouseInfo.description')}
        </AlertDescription>
      </Alert>
    </div>
  );
}
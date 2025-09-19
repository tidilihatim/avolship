import { Suspense } from 'react';
import { getSellerApiKeys, getApiKeyStats } from './_actions/api-keys';
import { ApiKeysList } from './_components/api-keys-list';
import { CreateApiKeyDialog } from './_components/create-api-key-dialog';
import { ApiKeyStats } from './_components/api-key-stats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Book, Shield } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Management - AvolShip',
  description: 'Create and manage API keys to integrate your systems with AvolShip platform. View API statistics, manage authentication credentials, and access comprehensive API documentation.',
};

async function ApiKeysContent() {
  const t = await getTranslations('apiManagement');
  const [apiKeysResult, statsResult] = await Promise.all([
    getSellerApiKeys(),
    getApiKeyStats()
  ]);

  if (apiKeysResult.error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{apiKeysResult.error}</p>
        </CardContent>
      </Card>
    );
  }

  const apiKeys = apiKeysResult.data || [];
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && <ApiKeyStats stats={stats} />}

      {/* API Keys Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('apiKeys.title')}
            </CardTitle>
            <CardDescription>
              {t('apiKeys.description')}
            </CardDescription>
          </div>
          <CreateApiKeyDialog />
        </CardHeader>
        <CardContent>
          <ApiKeysList apiKeys={apiKeys} />
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              {t('quickLinks.documentation.title')}
            </CardTitle>
            <CardDescription>
              {t('quickLinks.documentation.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/seller/api/docs">
                {t('quickLinks.documentation.button')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('quickLinks.security.title')}
            </CardTitle>
            <CardDescription>
              {t('quickLinks.security.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• {t('quickLinks.security.practices.storeSecurely')}</p>
              <p>• {t('quickLinks.security.practices.useHttps')}</p>
              <p>• {t('quickLinks.security.practices.monitorUsage')}</p>
              <p>• {t('quickLinks.security.practices.rotateKeys')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function ApiPage() {
  const t = await getTranslations('apiManagement');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('description')}
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded w-1/4"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }>
        <ApiKeysContent />
      </Suspense>
    </div>
  );
}
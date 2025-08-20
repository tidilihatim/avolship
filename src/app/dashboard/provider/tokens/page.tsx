"use client"

import { Suspense, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenBalanceCard } from './_components/token-balance-card';
import { PurchaseTokensSection } from './_components/purchase-tokens-section';
import { BoostCampaignsSection } from './_components/boost-campaigns-section';
import { TransactionHistorySection } from './_components/transaction-history-section';
import { Skeleton } from '@/components/ui/skeleton';

function TokensPageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default function ProviderTokensPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBalanceUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Boost Tokens</h1>
        <p className="text-muted-foreground">
          Purchase tokens and boost your profile visibility to get more clients
        </p>
      </div>

      <Suspense fallback={<TokensPageSkeleton />}>
        <div className="space-y-6" key={refreshKey}>
          <TokenBalanceCard />
          
          <Tabs defaultValue="purchase" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="purchase">Purchase Tokens</TabsTrigger>
              <TabsTrigger value="campaigns">Boost Campaigns</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="purchase" className="space-y-6">
              <PurchaseTokensSection onBalanceUpdate={handleBalanceUpdate} />
            </TabsContent>
            
            <TabsContent value="campaigns" className="space-y-6">
              <BoostCampaignsSection />
            </TabsContent>
            
            <TabsContent value="history" className="space-y-6">
              <TransactionHistorySection />
            </TabsContent>
          </Tabs>
        </div>
      </Suspense>
    </div>
  );
}
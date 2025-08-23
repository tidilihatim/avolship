import { Suspense } from 'react'
import { Trophy, Truck, ShoppingCart } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaderboardContainer } from '@/components/leaderboard'
import { LeaderboardDisabled } from '@/components/leaderboard/leaderboard-disabled'
import { fetchProviderLeaderboard, fetchSellerLeaderboard, getSellerUserPosition } from '@/app/actions/seller-leaderboard'
import { getLeaderboardSettings } from '@/app/actions/leaderboard-settings'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-8 w-16 mt-2" />
                <Skeleton className="h-3 w-20 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SellerCompetitionTab() {
  return (
    <LeaderboardContainer
      title="Seller Competition"
      description="Top performing sellers ranked by total revenue - compete with other sellers!"
      icon={<ShoppingCart className="h-6 w-6 text-orange-500" />}
      fetchLeaderboard={fetchSellerLeaderboard}
      getCurrentUserPosition={getSellerUserPosition}
      initialPeriod="monthly"
      showAdditionalInfo={true}
    />
  )
}

function ProviderPerformanceTab() {
  return (
    <LeaderboardContainer
      title="Provider Performance"
      description="Top performing providers ranked by expedition count - find the best logistics partners!"
      icon={<Truck className="h-6 w-6 text-blue-500" />}
      fetchLeaderboard={fetchProviderLeaderboard}
      initialPeriod="monthly"
      showAdditionalInfo={true}
    />
  )
}

export default async function SellerLeaderboardPage() {
  const settings = await getLeaderboardSettings()
  
  // If both seller and provider leaderboards are disabled
  if (!settings.enableSellerLeaderboard && !settings.enableProviderLeaderboard) {
    return <LeaderboardDisabled />
  }
  
  // If only one is enabled, show that one without tabs
  if (settings.enableSellerLeaderboard && !settings.enableProviderLeaderboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <div>
            <h1 className="text-xl font-semibold">Seller Competition</h1>
            <p className="text-sm text-muted-foreground">
              Compete with other sellers and track your performance
            </p>
          </div>
        </div>
        
        <Suspense fallback={<LeaderboardSkeleton />}>
          <SellerCompetitionTab />
        </Suspense>
      </div>
    )
  }
  
  if (!settings.enableSellerLeaderboard && settings.enableProviderLeaderboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <div>
            <h1 className="text-xl font-semibold">Provider Performance</h1>
            <p className="text-sm text-muted-foreground">
              Discover top-performing providers for partnerships
            </p>
          </div>
        </div>
        
        <Suspense fallback={<LeaderboardSkeleton />}>
          <ProviderPerformanceTab />
        </Suspense>
      </div>
    )
  }

  // Both are enabled, show tabs
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <div>
          <h1 className="text-xl font-semibold">Leaderboards</h1>
          <p className="text-sm text-muted-foreground">
            Compete with other sellers and discover top-performing providers
          </p>
        </div>
      </div>

      <Tabs defaultValue="sellers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sellers" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Seller Competition
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Provider Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sellers" className="space-y-6">
          <Suspense fallback={<LeaderboardSkeleton />}>
            <SellerCompetitionTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <Suspense fallback={<LeaderboardSkeleton />}>
            <ProviderPerformanceTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
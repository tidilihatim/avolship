import { Suspense } from 'react'
import { Trophy, Truck, MapPin, Phone, ShoppingCart } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaderboardContainer } from '@/components/leaderboard'
import { fetchProviderLeaderboard } from '@/app/actions/provider-leaderboard'
import { fetchDeliveryLeaderboard } from '@/app/actions/delivery-leaderboard'
import { fetchCallCenterLeaderboard } from '@/app/actions/call-center-leaderboard'
import { fetchSellerLeaderboard } from '@/app/actions/seller-leaderboard'
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

function ProviderLeaderboardTab() {
  return (
    <LeaderboardContainer
      title="Provider Leaderboard"
      description="Top performing providers ranked by expedition count"
      icon={<Truck className="h-6 w-6 text-blue-500" />}
      fetchLeaderboard={fetchProviderLeaderboard}
      initialPeriod="monthly"
      showAdditionalInfo={true}
    />
  )
}

function DeliveryLeaderboardTab() {
  return (
    <LeaderboardContainer
      title="Delivery Leaderboard"
      description="Top performing delivery riders ranked by completed deliveries"
      icon={<MapPin className="h-6 w-6 text-green-500" />}
      fetchLeaderboard={fetchDeliveryLeaderboard}
      initialPeriod="monthly"
      showAdditionalInfo={true}
    />
  )
}

function CallCenterLeaderboardTab() {
  return (
    <LeaderboardContainer
      title="Call Center Leaderboard"
      description="Top performing agents ranked by orders handled"
      icon={<Phone className="h-6 w-6 text-purple-500" />}
      fetchLeaderboard={fetchCallCenterLeaderboard}
      initialPeriod="monthly"
      showAdditionalInfo={true}
    />
  )
}

function SellerLeaderboardTab() {
  return (
    <LeaderboardContainer
      title="Seller Leaderboard"
      description="Top performing sellers ranked by total revenue"
      icon={<ShoppingCart className="h-6 w-6 text-orange-500" />}
      fetchLeaderboard={fetchSellerLeaderboard}
      initialPeriod="monthly"
      showAdditionalInfo={true}
    />
  )
}

export default function AdminLeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <div>
          <h1 className="text-xl font-semibold">Platform Leaderboards</h1>
          <p className="text-sm text-muted-foreground">
            Monitor performance across all user roles and track platform engagement
          </p>
        </div>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Delivery
          </TabsTrigger>
          <TabsTrigger value="call-center" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call Center
          </TabsTrigger>
          <TabsTrigger value="sellers" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sellers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <Suspense fallback={<LeaderboardSkeleton />}>
            <ProviderLeaderboardTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Suspense fallback={<LeaderboardSkeleton />}>
            <DeliveryLeaderboardTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="call-center" className="space-y-6">
          <Suspense fallback={<LeaderboardSkeleton />}>
            <CallCenterLeaderboardTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-6">
          <Suspense fallback={<LeaderboardSkeleton />}>
            <SellerLeaderboardTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
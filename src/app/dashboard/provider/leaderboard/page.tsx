import { Suspense } from 'react'
import { Truck, Trophy } from 'lucide-react'
import { LeaderboardContainer } from '@/components/leaderboard'
import { LeaderboardDisabled } from '@/components/leaderboard/leaderboard-disabled'
import { fetchProviderLeaderboard, getProviderUserPosition } from '@/app/actions/provider-leaderboard'
import { isLeaderboardEnabled } from '@/app/actions/leaderboard-settings'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

function ProviderLeaderboardSkeleton() {
  
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

async function ProviderLeaderboardContent() {
  return (
    <LeaderboardContainer
      title="Provider Leaderboard"
      description="Top performing providers ranked by expedition count this period"
      icon={<Truck className="h-6 w-6 text-blue-500" />}
      fetchLeaderboard={fetchProviderLeaderboard}
      getCurrentUserPosition={getProviderUserPosition}
      initialPeriod="monthly"
      showAdditionalInfo={true}
    />
  )
}

export default async function ProviderLeaderboardPage() {
  const isEnabled = await isLeaderboardEnabled('provider')
  const t = await getTranslations('leaderboard');
  
  if (!isEnabled) {
    return (
      <LeaderboardDisabled 
        title="Provider Leaderboard Temporarily Unavailable"
        description="The provider leaderboard is currently disabled. Please check back later!"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <div>
          <h1 className="text-xl font-semibold">{t("providers.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("providers.description")}
          </p>
        </div>
      </div>

      <Suspense fallback={<ProviderLeaderboardSkeleton />}>
        <ProviderLeaderboardContent />
      </Suspense>
    </div>
  )
}
import { Suspense } from 'react'
import { Headphones, Trophy, Phone } from 'lucide-react'
import { LeaderboardContainer } from '@/components/leaderboard'
import { LeaderboardDisabled } from '@/components/leaderboard/leaderboard-disabled'
import { fetchCallCenterLeaderboard, getCallCenterUserPosition } from '@/app/actions/call-center-leaderboard'
import { isLeaderboardEnabled } from '@/app/actions/leaderboard-settings'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function CallCenterLeaderboardSkeleton() {
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

async function CallCenterLeaderboardContent() {
  return (
    <LeaderboardContainer
      title="Call Center Leaderboard"
      description="Top performing agents ranked by orders handled this period"
      icon={<Phone className="h-6 w-6 text-purple-500" />}
      fetchLeaderboard={fetchCallCenterLeaderboard}
      getCurrentUserPosition={getCallCenterUserPosition}
      initialPeriod="monthly"
      showAdditionalInfo={true}
    />
  )
}

export default async function CallCenterLeaderboardPage() {
  const isEnabled = await isLeaderboardEnabled('call_center')
  
  if (!isEnabled) {
    return (
      <LeaderboardDisabled 
        title="Call Center Leaderboard Temporarily Unavailable"
        description="The call center leaderboard is currently disabled. Please check back later!"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <div>
          <h1 className="text-xl font-semibold">Agent Performance</h1>
          <p className="text-sm text-muted-foreground">
            Track your call center performance and compete with other agents
          </p>
        </div>
      </div>

      <Suspense fallback={<CallCenterLeaderboardSkeleton />}>
        <CallCenterLeaderboardContent />
      </Suspense>
    </div>
  )
}
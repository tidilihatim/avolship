'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Clock } from "lucide-react"

interface LeaderboardDisabledProps {
  title?: string
  description?: string
}

export function LeaderboardDisabled({ 
  title = "Leaderboard Temporarily Unavailable", 
  description = "The leaderboard is currently disabled. Please check back later!" 
}: LeaderboardDisabledProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <div>
          <h1 className="text-xl font-semibold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Compete and track performance
          </p>
        </div>
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
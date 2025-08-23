'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, TrendingUp, Users, Calendar } from "lucide-react"
import { LeaderboardPeriod } from "@/app/actions/leaderboard"

interface LeaderboardHeaderProps {
  title: string
  description: string
  period: LeaderboardPeriod
  onPeriodChange: (period: LeaderboardPeriod) => void
  totalParticipants: number
  userRank?: number
  userScore?: number
  icon?: React.ReactNode
}

export function LeaderboardHeader({
  title,
  description,
  period,
  onPeriodChange,
  totalParticipants,
  userRank,
  userScore,
  icon
}: LeaderboardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon || <Trophy className="h-6 w-6 text-yellow-500" />}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              Active in {period} period
            </p>
          </CardContent>
        </Card>

        {userRank && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{userRank}</div>
              <p className="text-xs text-muted-foreground">
                Out of {totalParticipants}
              </p>
            </CardContent>
          </Card>
        )}

        {userScore !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userScore}</div>
              <p className="text-xs text-muted-foreground">
                This {period.slice(0, -2)}
              </p>
            </CardContent>
          </Card>
        )}

        {(!userRank && userScore === undefined) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{period}</div>
              <p className="text-xs text-muted-foreground">
                Current leaderboard period
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
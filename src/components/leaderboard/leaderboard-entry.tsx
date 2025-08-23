'use client'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LeaderboardEntry } from "@/app/actions/leaderboard"
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface LeaderboardEntryProps {
  entry: LeaderboardEntry
  showAdditionalInfo?: boolean
  compact?: boolean
}

export function LeaderboardEntryComponent({
  entry,
  showAdditionalInfo = true,
  compact = false
}: LeaderboardEntryProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  const getChangeIcon = (change?: 'up' | 'down' | 'same') => {
    switch (change) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'same':
        return <Minus className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank <= 3) return "default"
    if (rank <= 10) return "secondary"
    return "outline"
  }

  return (
    <Card className={cn(
      "transition-colors hover:bg-muted/50",
      compact && "p-2"
    )}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-center gap-3">
          {/* Rank */}
          <div className="flex items-center gap-2 min-w-[60px]">
            <Badge variant={getRankBadgeVariant(entry.rank)} className="text-sm font-bold">
              #{entry.rank}
            </Badge>
            {getRankIcon(entry.rank)}
          </div>

          {/* Avatar and Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className={cn("h-10 w-10", compact && "h-8 w-8")}>
              <AvatarImage src={entry.avatar} alt={entry.name} />
              <AvatarFallback className="text-sm font-medium">
                {entry.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{entry.name}</h3>
                {entry.change && getChangeIcon(entry.change)}
              </div>
              {entry.businessName && (
                <p className="text-xs text-muted-foreground truncate">{entry.businessName}</p>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="text-right">
            <div className="text-lg font-bold">{entry.score.toLocaleString()}</div>
            {entry.previousRank && (
              <div className="text-xs text-muted-foreground">
                Was #{entry.previousRank}
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {showAdditionalInfo && entry.additionalInfo && !compact && (
          <div className="mt-3 pt-3 border-t">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {Object.entries(entry.additionalInfo).map(([key, value]) => {
                if (value === undefined || value === null) return null
                
                const formatKey = (k: string) => {
                  return k.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim()
                }

                const formatValue = (v: any) => {
                  if (typeof v === 'number') {
                    if (key.includes('Rate') || key.includes('Percentage')) {
                      return `${v}%`
                    }
                    if (key.includes('Value') || key.includes('Earnings')) {
                      return `$${v.toLocaleString()}`
                    }
                    if (key.includes('Distance')) {
                      return `${v} km`
                    }
                    return v.toLocaleString()
                  }
                  if (typeof v === 'boolean') {
                    return v ? 'Yes' : 'No'
                  }
                  return String(v)
                }

                return (
                  <div key={key} className="flex flex-col">
                    <span className="text-muted-foreground">{formatKey(key)}</span>
                    <span className="font-medium">{formatValue(value)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
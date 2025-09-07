'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, TrendingUp, Users, Calendar } from "lucide-react"
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('leaderboard.common');
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
            <SelectItem value="weekly">{t('periods.weekly')}</SelectItem>
            <SelectItem value="monthly">{t('periods.monthly')}</SelectItem>
            <SelectItem value="yearly">{t('periods.yearly')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalParticipants')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              {t('activeInPeriod', { period: t(`periods.${period}`) })}
            </p>
          </CardContent>
        </Card>

        {userRank && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('yourRank')}</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{userRank}</div>
              <p className="text-xs text-muted-foreground">
                {t('outOf', { total: totalParticipants })}
              </p>
            </CardContent>
          </Card>
        )}

        {userScore !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('yourScore')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userScore}</div>
              <p className="text-xs text-muted-foreground">
                {t('thisPeriod', { period: t(`periodSingular.${period.slice(0, -2)}`) })}
              </p>
            </CardContent>
          </Card>
        )}

        {(!userRank && userScore === undefined) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('period')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{period}</div>
              <p className="text-xs text-muted-foreground">
                {t('currentLeaderboardPeriod')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
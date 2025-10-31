import React from 'react'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  PhoneCall,
  Timer
} from 'lucide-react'
import {
  getCallCenterStats,
  getPriorityQueue,
  getRecentActivity,
  getCallOutcomeData,
  getHourlyCallData,
  getPerformanceTrends,
  getPriorityDistribution
} from '@/app/actions/call-center'
import Link from 'next/link'
import { CallCenterDashboardClient } from '@/components/call-center/call-center-dashboard-client'
import { CallOutcomeChart } from '@/components/call-center/dashboard/charts/call-outcome-chart'
import { HourlyCallsChart } from '@/components/call-center/dashboard/charts/hourly-calls-chart'
import { PerformanceTrendsChart } from '@/components/call-center/dashboard/charts/performance-trends-chart'
import { PriorityDistributionChart } from '@/components/call-center/dashboard/charts/priority-distribution-chart'
import { TotalCallsMadeWrapper } from '@/components/call-center/dashboard/charts/total-calls-made-wrapper'
import { ConfirmationRateWrapper } from '@/components/call-center/dashboard/charts/confirmation-rate-wrapper'
import { AverageCallDurationWrapper } from '@/components/call-center/dashboard/charts/average-call-duration-wrapper'
import { AgentPerformanceRankingWrapper } from '@/components/call-center/dashboard/charts/agent-performance-ranking-wrapper'
import { FollowUpCallsWrapper } from '@/components/call-center/dashboard/charts/follow-up-calls-wrapper'

const CallCenterDashboard = async ({ searchParams }: { searchParams: Promise<{ startDate?: string; endDate?: string }> }) => {
  const { startDate, endDate } = await searchParams
  const t = await getTranslations('callCenterDashboard')

  // Fetch data for the dashboard
  const [
    statsResult,
    queueResult,
    activityResult,
    callOutcomeResult,
    hourlyCallsResult,
    performanceTrendsResult,
    priorityDistributionResult
  ] = await Promise.all([
    getCallCenterStats(startDate, endDate),
    getPriorityQueue(),
    getRecentActivity(startDate, endDate),
    getCallOutcomeData(startDate, endDate),
    getHourlyCallData(startDate, endDate),
    getPerformanceTrends(startDate, endDate),
    getPriorityDistribution()
  ])

  const stats = statsResult.success ? statsResult.stats : null
  const priorityOrders = queueResult.success ? queueResult.orders : []
  const recentActivities = activityResult.success ? activityResult.activities : []
  const callOutcomes = callOutcomeResult.success ? { data: callOutcomeResult.data || [], total: callOutcomeResult.total || 0 } : { data: [], total: 0 }
  const hourlyCalls = hourlyCallsResult.success ? hourlyCallsResult.data || [] : []
  const performanceTrends = performanceTrendsResult.success ? performanceTrendsResult.data || [] : []
  const priorityDistribution = priorityDistributionResult.success ? { data: priorityDistributionResult.data || [], total: priorityDistributionResult.total || 0 } : { data: [], total: 0 }
  
  // Generate dynamic labels based on date range
  const getDateRangeLabel = () => {
    if (!startDate || !endDate) return t('dateRange.today')

    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    // Check if it's today
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    if (start.getTime() === today.getTime() && end.getDate() === todayEnd.getDate()) {
      return t('dateRange.today')
    }

    // Check if it's yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    if (start.getTime() === yesterday.getTime() && end.getTime() === yesterdayEnd.getTime()) {
      return t('dateRange.yesterday')
    }

    // Check for this week
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)
    startOfWeek.setHours(0, 0, 0, 0)

    if (start.getTime() === startOfWeek.getTime()) {
      return t('dateRange.thisWeek')
    }

    // Check for this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    if (start.getTime() === startOfMonth.getTime()) {
      return t('dateRange.thisMonth')
    }

    // Calculate day difference for other ranges
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    switch (daysDiff) {
      case 2: return t('dateRange.last3Days')
      case 6: return t('dateRange.last7Days')
      case 29: return t('dateRange.last30Days')
      default:
        // Custom range - show dates
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${startStr} - ${endStr}`
    }
  }
  
  const dateRangeLabel = getDateRangeLabel()

  return (
    <CallCenterDashboardClient>
      {/* Key Performance Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* My Assigned Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('metrics.myAssignedOrders')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrdersToday}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingConfirmations} {t('metrics.pendingCalls')}
              </p>
            </CardContent>
          </Card>

          {/* Calls Made */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('metrics.callsMade')} {dateRangeLabel}</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCallAttempts}</div>
              <p className="text-xs text-muted-foreground">
                {t('metrics.avg')} {stats.avgCallTime}{t('metrics.perCall')}
              </p>
            </CardContent>
          </Card>

          {/* Confirmed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('metrics.confirmed')} {dateRangeLabel}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.successfulCalls}</div>
              <p className="text-xs text-muted-foreground">
                {stats.successRate}% {t('metrics.successRate')}
              </p>
            </CardContent>
          </Card>

          {/* Priority Queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('metrics.priorityQueue')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.queueLength}</div>
              <p className="text-xs text-muted-foreground">
                {t('metrics.ordersNeedCalling')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Agent Performance Ranking - Full Width */}
        <AgentPerformanceRankingWrapper startDate={startDate} endDate={endDate} />

        {/* Top Row - Total Calls & Confirmation Rate */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          <TotalCallsMadeWrapper startDate={startDate} endDate={endDate} />
          <ConfirmationRateWrapper startDate={startDate} endDate={endDate} />
        </div>

        {/* Second Row - Call Outcomes & Priority Distribution */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          <CallOutcomeChart data={callOutcomes.data} total={callOutcomes.total} />
          <PriorityDistributionChart data={priorityDistribution.data} total={priorityDistribution.total} />
        </div>

        {/* Third Row - Average Call Duration */}
        <AverageCallDurationWrapper startDate={startDate} endDate={endDate} />

        {/* Fourth Row - Follow-up Calls Required */}
        <FollowUpCallsWrapper startDate={startDate} endDate={endDate} />

        {/* Performance Trends - Full Width */}
        <PerformanceTrendsChart data={performanceTrends} />

        {/* Hourly Activity Chart - Full Width */}
        <HourlyCallsChart data={hourlyCalls} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Priority Orders to Call */}
        {/* <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {t('priorityOrders.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityOrders?.slice(0, 6).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{order.customerName}</span>
                      <Badge
                        variant={
                          order.priority === 'urgent' ? 'destructive' :
                          order.priority === 'high' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {order.priority?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('priorityOrders.order')} {order.orderId} • ${order.totalPrice} {order.currency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      📞 {order.phoneNumbers?.[0]} • {t('priorityOrders.waiting')} {Math.floor(order.waitingTime / 60)}h {order.waitingTime % 60}m
                    </div>
                    {order.attempts > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        {order.attempts} {t('priorityOrders.previousAttempts')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/call-center/call/${order._id}`}>
                        <Phone className="w-4 h-4 mr-1" />
                        {t('priorityOrders.callNow')}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}

              {priorityOrders?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>{t('priorityOrders.noPendingCalls')}</p>
                </div>
              )}

              {priorityOrders && priorityOrders?.length > 6 && (
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/call-center/queue">
                      {t('priorityOrders.viewAllOrders')} ({priorityOrders?.length})
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card> */}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('recentActivity.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities?.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.type === 'call_attempt' ? (
                      activity.status === 'answered' ? 'bg-green-500' : 'bg-orange-500'
                    ) : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="break-words">{activity.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {recentActivities?.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Timer className="w-8 h-8 mx-auto mb-2" />
                  <p>{t('recentActivity.noActivity')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </CallCenterDashboardClient>
  )
}

export default CallCenterDashboard
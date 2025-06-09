import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Clock, CheckCircle, AlertCircle, TrendingUp, Users, PhoneCall } from 'lucide-react'
import { getCallCenterStats, getHourlyCallData, getCallOutcomeData, getWeeklyPerformanceData, getPriorityQueue, getRecentActivity } from '@/app/actions/call-center'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

const CallCenterDashboard = async () => {
  const t = await getTranslations('callCenter')
  
  const [
    statsResult,
    hourlyDataResult,
    outcomeDataResult,
    weeklyDataResult,
    queueResult,
    activityResult
  ] = await Promise.all([
    getCallCenterStats(),
    getHourlyCallData(),
    getCallOutcomeData(),
    getWeeklyPerformanceData(),
    getPriorityQueue(),
    getRecentActivity()
  ]);

  const stats = statsResult.success ? statsResult.stats : null;
  const priorityOrders = queueResult.success ? queueResult.orders : [];
  const recentActivities = activityResult.success ? activityResult.activities : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/call-center/queue">
              <Phone className="w-4 h-4 mr-2" />
              {t('actions.priorityQueue')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/call-center/reports">
              <TrendingUp className="w-4 h-4 mr-2" />
              {t('actions.viewReports')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.totalOrdersToday')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrdersToday}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingConfirmations} {t('dashboard.pendingConfirmations').toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.successRate')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.successfulCalls} {t('dashboard.confirmedCalls')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.averageCallTime')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCallTime}m</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalCallAttempts} {t('dashboard.totalAttempts')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.queueLength')}</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.queueLength}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.activeCalls')}: {stats.activeCalls}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {t('sections.priorityQueue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityOrders?.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.orderId} • ${order.totalPrice} {order.currency}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        order.priority === 'urgent' ? 'destructive' : 
                        order.priority === 'high' ? 'default' : 'secondary'
                      }
                    >
                      {t(`priority.${order.priority}`)}
                    </Badge>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/call-center/queue?orderId=${order._id}`}>
                        {t('actions.call')}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {priorityOrders?.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  {t('messages.noOrdersInQueue')}
                </div>
              )}
              {priorityOrders && priorityOrders?.length > 5 && (
                <div className="text-center pt-3">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/call-center/queue">
                      {t('actions.viewAll')} ({priorityOrders?.length})
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities?.map((activity:any, index:number) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'status_change' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <div>{activity.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {recentActivities?.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  {t('messages.noRecentActivity')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-20 flex-col">
              <Link href="/dashboard/call-center/queue">
                <Phone className="w-6 h-6 mb-2" />
                {t('actions.startCalling')}
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex-col">
              <Link href="/dashboard/call-center/customers">
                <Users className="w-6 h-6 mb-2" />
                {t('actions.customerDatabase')}
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex-col">
              <Link href="/dashboard/call-center/reports">
                <TrendingUp className="w-6 h-6 mb-2" />
                {t('actions.viewReports')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CallCenterDashboard
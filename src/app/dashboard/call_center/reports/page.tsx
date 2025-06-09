import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Calendar, BarChart3, PieChart, TrendingUp } from 'lucide-react'
import { getCallCenterStats, getHourlyCallData, getCallOutcomeData, getWeeklyPerformanceData } from '@/app/actions/call-center'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

const CallCenterReports = async () => {
  const t = await getTranslations('callCenter')
  
  const [
    statsResult,
    hourlyDataResult,
    outcomeDataResult,
    weeklyDataResult
  ] = await Promise.all([
    getCallCenterStats(),
    getHourlyCallData(),
    getCallOutcomeData(),
    getWeeklyPerformanceData()
  ]);

  const stats = statsResult.success ? statsResult.stats : null;
  const hourlyData = hourlyDataResult.success ? (hourlyDataResult.data || []) : [];
  const outcomeData = outcomeDataResult.success ? (outcomeDataResult.data|| []) : [];
  const weeklyData = weeklyDataResult.success ? (weeklyDataResult.data || []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/call-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
            <p className="text-muted-foreground mt-1">
              Performance analytics and call center metrics
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t('reports.exportData')}
          </Button>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            {t('reports.generateReport')}
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('performance.callVolume')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCallAttempts}</div>
              <p className="text-xs text-muted-foreground">
                Total calls today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('performance.successRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                Confirmation rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('performance.averageHandlingTime')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCallTime}m</div>
              <p className="text-xs text-muted-foreground">
                Per call average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.customersContacted')}</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customersContacted}</div>
              <p className="text-xs text-muted-foreground">
                Unique customers
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Call Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Call Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hourlyData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.hour}</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      {item.calls} calls
                    </div>
                    <div className="text-sm text-green-600">
                      {item.confirmed} confirmed
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{
                          width: `${item.calls > 0 ? (item.confirmed / item.calls) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {hourlyData.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No hourly data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outcomeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}%</span>
                </div>
              ))}
              {outcomeData.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No outcome data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('performance.weeklyTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {weeklyData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm font-medium mb-2">{item.day}</div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Calls</div>
                    <div className="text-lg font-bold">{item.calls}</div>
                    <div className="text-xs text-green-600">
                      {item.success} success
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-green-600 h-1 rounded-full" 
                        style={{
                          width: `${item.calls > 0 ? (item.success / item.calls) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {weeklyData.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No weekly data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Report Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Download className="w-6 h-6 mb-2" />
              {t('reports.callLogs')}
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="w-6 h-6 mb-2" />
              {t('reports.agentPerformance')}
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TrendingUp className="w-6 h-6 mb-2" />
              Daily Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CallCenterReports
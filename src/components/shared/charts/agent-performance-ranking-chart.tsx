'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { Trophy, TrendingUp, Target, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface AgentPerformanceDataPoint {
  agentId: string;
  agentName: string;
  agentEmail: string;
  totalOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  confirmationRate: number;
  deliveryRate: number;
  performanceScore: number;
  rank?: number;
}

export interface AgentPerformanceRankingChartProps {
  data: AgentPerformanceDataPoint | AgentPerformanceDataPoint[]; // Single agent or array
  totalAgents?: number;
  viewMode?: 'single' | 'ranking'; // single for call center, ranking for admin
}

const chartConfig = {
  performanceScore: {
    label: 'Performance Score',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))'
    }
  }
} satisfies ChartConfig;

export function AgentPerformanceRankingChart({
  data,
  totalAgents,
  viewMode = 'ranking'
}: AgentPerformanceRankingChartProps) {
  const t = useTranslations('callCenterDashboard.charts.agentPerformanceRanking');

  // Single agent view (for call center users)
  if (viewMode === 'single' && !Array.isArray(data)) {
    const agent = data;

    const getRankBadge = (rank?: number) => {
      if (!rank) return null;

      if (rank === 1) {
        return (
          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
            <Trophy className="w-3 h-3 mr-1" />
            #{rank} - Top Performer
          </Badge>
        );
      } else if (rank <= 3) {
        return (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600">
            <Award className="w-3 h-3 mr-1" />
            #{rank}
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary">
            #{rank}
          </Badge>
        );
      }
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('title')}</CardTitle>
            {getRankBadge(agent.rank)}
          </div>
          <CardDescription>
            {agent.rank && totalAgents && (
              <>{t('yourRank', { rank: agent.rank, total: totalAgents })}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Performance Score */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <div>
                <p className="text-sm text-muted-foreground">{t('performanceScore')}</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{agent.performanceScore}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Confirmation Rate */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium">{t('confirmationRate')}</p>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{agent.confirmationRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {agent.confirmedOrders}/{agent.totalOrders} {t('orders')}
                </p>
              </div>

              {/* Delivery Rate */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-medium">{t('deliveryRate')}</p>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{agent.deliveryRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {agent.deliveredOrders}/{agent.totalOrders} {t('orders')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ranking view (for admins)
  const agents = Array.isArray(data) ? data : [data];

  if (!agents || agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('noData')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">{t('noAgentsYet')}</p>
            <p className="text-xs mt-1">{t('dataWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart - show top 10 agents
  const chartData = agents.slice(0, 10).map(agent => ({
    name: agent.agentName,
    performanceScore: agent.performanceScore,
    rank: agent.rank
  }));

  // Color scale based on rank
  const getBarColor = (rank?: number) => {
    if (!rank) return 'hsl(var(--chart-1))';
    if (rank === 1) return 'hsl(45, 93%, 47%)'; // gold
    if (rank === 2) return 'hsl(0, 0%, 75%)'; // silver
    if (rank === 3) return 'hsl(29, 58%, 49%)'; // bronze
    return 'hsl(var(--chart-1))';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('showingTopAgents', { count: Math.min(10, agents.length), total: agents.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] sm:h-[450px] lg:h-[500px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 20,
              right: 30,
              left: 100,
              bottom: 20
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={95}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => {
                    const agent = agents.find(a => a.agentName === props.payload.name);
                    return [
                      <div key="tooltip" className="space-y-1">
                        <div className="font-semibold">{props.payload.name}</div>
                        <div className="text-sm">
                          <div>{t('performanceScore')}: {value}%</div>
                          <div>{t('confirmationRate')}: {agent?.confirmationRate}%</div>
                          <div>{t('deliveryRate')}: {agent?.deliveryRate}%</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {agent?.totalOrders} {t('totalOrders')}
                          </div>
                        </div>
                      </div>,
                      ''
                    ];
                  }}
                />
              }
            />
            <Bar
              dataKey="performanceScore"
              radius={[0, 8, 8, 0]}
              name="performanceScore"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.rank)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Top 3 Summary */}
        {agents.length >= 3 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {agents.slice(0, 3).map((agent, index) => (
              <div
                key={agent.agentId}
                className={`p-4 border rounded-lg ${
                  index === 0 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                  index === 1 ? 'border-gray-400 bg-gray-50 dark:bg-gray-950/20' :
                  'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {index === 0 && <Trophy className="w-5 h-5 text-yellow-600" />}
                  {index === 1 && <Award className="w-5 h-5 text-gray-600" />}
                  {index === 2 && <Award className="w-5 h-5 text-orange-600" />}
                  <span className="font-semibold">#{agent.rank}</span>
                </div>
                <p className="font-medium truncate">{agent.agentName}</p>
                <p className="text-2xl font-bold mt-1">{agent.performanceScore}%</p>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <div>Conf: {agent.confirmationRate}% • Del: {agent.deliveryRate}%</div>
                  <div>{agent.totalOrders} {t('orders')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

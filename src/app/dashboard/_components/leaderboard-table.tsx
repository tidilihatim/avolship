'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, Star, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    businessName?: string;
  };
  rank: number;
  previousRank?: number;
  totalScore: number;
  providerMetrics?: any;
  sellerMetrics?: any;
  callCenterAgentMetrics?: any;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  type: 'provider' | 'seller' | 'call_center_agent';
  loading?: boolean;
}

export default function LeaderboardTable({ data, type, loading = false }: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <span className="text-sm font-semibold">{rank}</span>
          </div>
        );
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return <span className="text-muted-foreground">—</span>;
    const change = previous - current;
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="w-3 h-3" />
          <span className="text-xs font-medium">+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="w-3 h-3" />
          <span className="text-xs font-medium">{change}</span>
        </div>
      );
    }
    return <span className="text-muted-foreground text-xs">—</span>;
  };

  const renderMetrics = (entry: LeaderboardEntry) => {
    if (type === 'provider' && entry.providerMetrics) {
      return (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">{entry.providerMetrics.successfulDeliveries}</span>
            <span className="text-muted-foreground">deliveries</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{entry.providerMetrics.onTimeDeliveryRate.toFixed(0)}%</span>
            <span className="text-muted-foreground">on-time</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="font-medium">{entry.providerMetrics.customerRating.toFixed(1)}</span>
          </div>
        </div>
      );
    } else if (type === 'seller' && entry.sellerMetrics) {
      return (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">{entry.sellerMetrics.confirmedOrders}</span>
            <span className="text-muted-foreground">orders</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{entry.sellerMetrics.conversionRate.toFixed(0)}%</span>
            <span className="text-muted-foreground">conversion</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{entry.sellerMetrics.deliveredOrders}</span>
            <span className="text-muted-foreground">delivered</span>
          </div>
        </div>
      );
    } else if (type === 'call_center_agent' && entry.callCenterAgentMetrics) {
      return (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">{entry.callCenterAgentMetrics.confirmedOrders}</span>
            <span className="text-muted-foreground">confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{entry.callCenterAgentMetrics.callSuccessRate.toFixed(0)}%</span>
            <span className="text-muted-foreground">success</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="font-medium">{entry.callCenterAgentMetrics.customerSatisfactionScore.toFixed(1)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Complete Rankings
          </CardTitle>
          <Badge variant="outline">{data.length} participants</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Performance Metrics</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-center w-20">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow 
                key={entry._id}
                className={cn(
                  "transition-colors",
                  entry.rank === 1 && "bg-yellow-500/5 hover:bg-yellow-500/10",
                  entry.rank === 2 && "bg-gray-500/5 hover:bg-gray-500/10",
                  entry.rank === 3 && "bg-amber-600/5 hover:bg-amber-600/10"
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{entry.userId.businessName || entry.userId.name}</div>
                    <div className="text-sm text-muted-foreground">{entry.userId.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {renderMetrics(entry)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "font-mono",
                      entry.rank <= 3 && "font-semibold"
                    )}
                  >
                    {entry.totalScore.toFixed(0)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {getRankChange(entry.rank, entry.previousRank)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
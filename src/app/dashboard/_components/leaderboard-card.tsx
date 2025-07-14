'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardCardProps {
  rank: number;
  name: string;
  businessName?: string;
  email: string;
  score: number;
  previousRank?: number;
  metrics: React.ReactNode;
  featured?: boolean;
}

export default function LeaderboardCard({
  rank,
  name,
  businessName,
  email,
  score,
  previousRank,
  metrics,
  featured = false
}: LeaderboardCardProps) {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return (
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <span className="text-lg font-bold">{rank}</span>
          </div>
        );
    }
  };

  const getRankChange = () => {
    if (!previousRank) return null;
    const change = previousRank - rank;
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm font-medium">{change}</span>
        </div>
      );
    }
    return (
      <div className="text-muted-foreground text-sm">
        <span>—</span>
      </div>
    );
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-lg",
      featured && rank === 1 && "border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 dark:from-yellow-500/10 dark:to-amber-500/10",
      featured && rank === 2 && "border-gray-500/20 bg-gradient-to-br from-gray-500/5 to-slate-500/5 dark:from-gray-500/10 dark:to-slate-500/10",
      featured && rank === 3 && "border-amber-600/20 bg-gradient-to-br from-amber-600/5 to-orange-600/5 dark:from-amber-600/10 dark:to-orange-600/10"
    )}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {getRankIcon()}
              <div>
                <h3 className="font-semibold text-lg">
                  {businessName || name}
                </h3>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
            {getRankChange()}
          </div>

          {/* Score */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium text-muted-foreground">Total Score</span>
            <Badge 
              variant="secondary" 
              className={cn(
                "font-mono text-base px-3 py-1",
                rank === 1 && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
                rank === 2 && "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
                rank === 3 && "bg-amber-600/10 text-amber-700 dark:text-amber-400 border-amber-600/20"
              )}
            >
              {score.toFixed(0)}
            </Badge>
          </div>

          {/* Metrics */}
          <div className="pt-2 border-t">
            {metrics}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
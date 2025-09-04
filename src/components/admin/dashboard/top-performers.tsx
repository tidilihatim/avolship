'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { TopPerformers } from '@/app/actions/admin-dashboard';

interface TopPerformersProps {
  data: TopPerformers[];
}

const formatMetric = (metric: number, label: string) => {
  if (label === 'Revenue') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(metric);
  }
  return metric.toLocaleString();
};

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'delivery':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'seller':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'support':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'call_center':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function TopPerformersComponent({ data }: TopPerformersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top Performers
        </CardTitle>
        <CardDescription>
          Outstanding performers across different roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 10).map((performer, index) => (
            <div
              key={performer.userId}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {index < 3 && (
                    <div className="flex items-center justify-center w-6 h-6">
                      {index === 0 && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                      {index === 1 && <Star className="h-4 w-4 text-gray-400 fill-gray-400" />}
                      {index === 2 && <Star className="h-4 w-4 text-amber-600 fill-amber-600" />}
                    </div>
                  )}
                  {index >= 3 && (
                    <span className="text-sm font-medium text-muted-foreground w-6 text-center">
                      #{index + 1}
                    </span>
                  )}
                </div>
                
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(performer.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{performer.name}</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs w-fit ${getRoleColor(performer.role)}`}
                  >
                    {performer.role}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {formatMetric(performer.metric, performer.metricLabel)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {performer.metricLabel}
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
          ))}
          
          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No performance data available yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
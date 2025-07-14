"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LogStats {
  today: {
    errors: number;
    warnings: number;
    info: number;
    criticalOps: number;
  };
  comparison: {
    errors: number; // percentage change from yesterday
    warnings: number;
  };
  topIssues: Array<{
    category: string;
    count: number;
    level: string;
  }>;
  performance: {
    slowQueries: number;
    avgResponseTime: number;
  };
}

export function LogStatsWidget() {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLogStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogStats = async () => {
    try {
      // This would call your actual stats API
      const response = await fetch('/api/admin/logs/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching log stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Mock data for demonstration
  const mockStats: LogStats = {
    today: {
      errors: 23,
      warnings: 45,
      info: 128,
      criticalOps: 67,
    },
    comparison: {
      errors: -15, // 15% decrease
      warnings: 8, // 8% increase
    },
    topIssues: [
      { category: 'api_error', count: 12, level: 'error' },
      { category: 'slow_query', count: 8, level: 'warn' },
      { category: 'auth_error', count: 5, level: 'error' },
    ],
    performance: {
      slowQueries: 3,
      avgResponseTime: 245,
    },
  };

  const data = stats || mockStats;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">System Health Overview</h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.today.errors}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {data.comparison.errors > 0 ? (
                <TrendingUp className="h-3 w-3 text-destructive mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
              )}
              {Math.abs(data.comparison.errors)}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.today.warnings}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {data.comparison.warnings > 0 ? (
                <TrendingUp className="h-3 w-3 text-warning mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
              )}
              {Math.abs(data.comparison.warnings)}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Operations</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.today.criticalOps}</div>
            <p className="text-xs text-muted-foreground">
              Orders, payments, refunds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {data.performance.slowQueries} slow queries
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topIssues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {issue.level === 'error' ? (
                    <AlertCircle className="h-3 w-3 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-warning" />
                  )}
                  <span className="text-sm">{issue.category.replace('_', ' ')}</span>
                </div>
                <span className="text-sm font-medium">{issue.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
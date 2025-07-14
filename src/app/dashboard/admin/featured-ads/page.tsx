"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FeaturedAdsTable from "./_components/featured-ads-table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface AdminAdStats {
  activeAds: number;
  totalImpressions: number;
  totalClicks: number;
  clickThroughRate: number;
}

export default function FeaturedAdsPage() {
  // const t = useTranslations("dashboard.admin.featuredAds");
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<AdminAdStats>({
    activeAds: 0,
    totalImpressions: 0,
    totalClicks: 0,
    clickThroughRate: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      
      const response = await fetch('/api/admin/featured-ads/analytics');
      if (response.ok) {
        const data = await response.json();
        setStats({
          activeAds: data.activeAds || 0,
          totalImpressions: data.totalImpressions || 0,
          totalClicks: data.totalClicks || 0,
          clickThroughRate: data.clickThroughRate || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Featured Provider Ads Management</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage provider advertisement requests
          </p>
        </div>
        <Link href="/dashboard/admin/featured-ads/analytics">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.activeAds}</div>
            )}
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{(stats.clickThroughRate || 0).toFixed(2)}%</div>
            )}
            <p className="text-xs text-muted-foreground">Click-through rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Featured Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <FeaturedAdsTable key={refreshKey} />
        </CardContent>
      </Card>

    </div>
  );
}
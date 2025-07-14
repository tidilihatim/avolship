"use client";

import { useState, useEffect } from "react";
import { Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MyAdsTable from "./_components/my-ads-table";
import CreateAdDialog from "./_components/create-ad-dialog";
import { toast } from "sonner";

interface AdStats {
  activeAds: number;
  pendingAds: number;
  totalImpressions: number;
  totalClicks: number;
}

export default function ProviderFeaturedAdsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<AdStats>({
    activeAds: 0,
    pendingAds: 0,
    totalImpressions: 0,
    totalClicks: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      
      // Fetch analytics data
      const analyticsResponse = await fetch('/api/provider/featured-ads/analytics?range=all');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        
        // Fetch ads to count pending
        const adsResponse = await fetch('/api/provider/featured-ads?status=ALL');
        let pendingCount = 0;
        
        if (adsResponse.ok) {
          const adsData = await adsResponse.json();
          pendingCount = adsData.ads.filter((ad: any) => ad.status === 'PENDING').length;
        }
        
        setStats({
          activeAds: analyticsData.activeAds || 0,
          pendingAds: pendingCount,
          totalImpressions: analyticsData.totalImpressions || 0,
          totalClicks: analyticsData.totalClicks || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleAdCreated = () => {
    setRefreshKey(prev => prev + 1);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Featured Ads</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your featured advertisements
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/provider/featured-ads/analytics">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </Link>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Ad
          </Button>
        </div>
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
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.pendingAds}</div>
            )}
            <p className="text-xs text-muted-foreground">Awaiting admin review</p>
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
            <p className="text-xs text-muted-foreground">All time views</p>
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
            <p className="text-xs text-muted-foreground">All time clicks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <MyAdsTable key={refreshKey} />
        </CardContent>
      </Card>

      <CreateAdDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleAdCreated}
      />
    </div>
  );
}
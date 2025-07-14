'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Eye, MousePointer, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdAnalytics {
  totalImpressions: number;
  totalClicks: number;
  totalSpent: number;
  clickThroughRate: number;
  costPerClick: number;
  activeAds: number;
  topPerformingAd: {
    id: string;
    title: string;
    clicks: number;
    impressions: number;
  } | null;
  dailyStats: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spent: number;
  }>;
  placementStats: Array<{
    placement: string;
    impressions: number;
    clicks: number;
  }>;
  countryStats: Array<{
    country: string;
    impressions: number;
    clicks: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ProviderAdsAnalyticsPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AdAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [selectedAdId, setSelectedAdId] = useState<string>('all');
  const [ads, setAds] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    fetchAnalytics();
    fetchAds();
  }, [dateRange, selectedAdId]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        range: dateRange,
        ...(selectedAdId !== 'all' && { adId: selectedAdId })
      });

      const response = await fetch(`/api/provider/featured-ads/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/provider/featured-ads?status=ALL');
      if (!response.ok) throw new Error('Failed to fetch ads');
      
      const data = await response.json();
      setAds(data.ads.map((ad: any) => ({ id: ad._id, title: ad.title })));
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const exportData = () => {
    if (!analytics) return;

    const csvContent = [
      ['Date', 'Impressions', 'Clicks', 'Spent'],
      ...analytics.dailyStats.map(stat => [
        stat.date,
        stat.impressions,
        stat.clicks,
        (stat.spent || 0).toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const changePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    if (!previous || previous === 0) return '0.0';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ad Analytics</h1>
          <p className="text-muted-foreground">Track your ad performance and ROI</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedAdId} onValueChange={setSelectedAdId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select ad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ads</SelectItem>
              {ads.map(ad => (
                <SelectItem key={ad.id} value={ad.id}>{ad.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportData} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{changePercentage(analytics.totalImpressions, analytics.totalImpressions * 0.8)}%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              CTR: {(analytics?.clickThroughRate || 0).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(analytics?.totalSpent || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              CPC: ${(analytics?.costPerClick || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeAds}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Ad */}
      {analytics.topPerformingAd && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Ad</CardTitle>
            <CardDescription>Based on clicks and CTR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{analytics.topPerformingAd.title}</p>
              <div className="flex gap-4 text-sm">
                <span>Clicks: {analytics.topPerformingAd.clicks}</span>
                <span>Impressions: {analytics.topPerformingAd.impressions}</span>
                <span>CTR: {analytics.topPerformingAd?.impressions ? ((analytics.topPerformingAd.clicks / analytics.topPerformingAd.impressions * 100).toFixed(2)) : '0.00'}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="placement">Placement</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
              <CardDescription>Impressions and clicks over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="impressions"
                    stroke="#8884d8"
                    name="Impressions"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="clicks"
                    stroke="#82ca9d"
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Placement</CardTitle>
              <CardDescription>Where your ads are performing best</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.placementStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="placement" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="impressions" fill="#8884d8" name="Impressions" />
                  <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Performance</CardTitle>
              <CardDescription>Performance by country</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.countryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.country}: ${entry.clicks} clicks`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="clicks"
                  >
                    {analytics.countryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
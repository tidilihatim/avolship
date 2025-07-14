'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Trophy, Database, Loader2, Settings, Info } from 'lucide-react';
import { toast } from 'sonner';
import LeaderboardTable from '@/app/dashboard/_components/leaderboard-table';
import LeaderboardCard from '@/app/dashboard/_components/leaderboard-card';
import ScoringExplanation from '@/app/dashboard/_components/scoring-explanation';
import { Star } from 'lucide-react';
import { LeaderboardType, LeaderboardPeriod } from '@/lib/db/models/leaderboard';

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
  lastUpdated: string;
}

export default function AdminLeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedType, setSelectedType] = useState(LeaderboardType.PROVIDER);
  const [selectedPeriod, setSelectedPeriod] = useState(LeaderboardPeriod.MONTHLY);
  const fetchingRef = React.useRef(false);

  const fetchLeaderboard = async () => {
    if (fetchingRef.current) return; // Prevent concurrent requests
    
    fetchingRef.current = true;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/leaderboard?type=${selectedType}&period=${selectedPeriod}`);
      
      if (response.status === 429) {
        // Rate limited, wait and retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryResponse = await fetch(`/api/admin/leaderboard?type=${selectedType}&period=${selectedPeriod}`);
        const retryData = await retryResponse.json();
        if (retryData.success) {
          setLeaderboardData(retryData.data);
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.data);
      } else {
        toast.error('Failed to fetch leaderboard');
      }
    } catch (error) {
      toast.error('Error fetching leaderboard');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const updateLeaderboard = async () => {
    setUpdating(true);
    try {
      console.log('Updating leaderboard with:', { type: selectedType, period: selectedPeriod });
      const response = await fetch('/api/admin/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, period: selectedPeriod }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Leaderboard updated successfully');
        fetchLeaderboard();
      } else {
        console.error('Update failed:', data);
        toast.error(data.error || 'Failed to update leaderboard');
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (error) {
      toast.error('Error updating leaderboard');
    } finally {
      setUpdating(false);
    }
  };

  const resetLeaderboard = async () => {
    if (!confirm('Are you sure you want to reset this leaderboard? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/admin/leaderboard/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, period: selectedPeriod }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Leaderboard reset successfully');
        fetchLeaderboard();
      } else {
        toast.error('Failed to reset leaderboard');
      }
    } catch (error) {
      toast.error('Error resetting leaderboard');
    }
  };

  const updateAllLeaderboards = async () => {
    if (!confirm('This will update all leaderboards across all types and periods. This may take several minutes. Continue?')) {
      return;
    }
    
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/leaderboard/update-all', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('All leaderboards are being updated. This may take a few minutes.');
      } else {
        toast.error('Failed to start leaderboard update');
      }
    } catch (error) {
      toast.error('Error updating leaderboards');
    } finally {
      setUpdating(false);
    }
  };

  const generateTestData = async () => {
    if (!confirm('This will seed leaderboard data for existing users. Continue?')) {
      return;
    }
    
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/leaderboard/seed', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Leaderboard seeded: ${data.data.sellersProcessed} sellers, ${data.data.providersProcessed} providers, ${data.data.agentsProcessed} agents`);
        fetchLeaderboard();
      } else {
        toast.error(data.error || 'Failed to seed leaderboard');
        console.error('Seed error:', data);
      }
    } catch (error) {
      toast.error('Error seeding leaderboard');
      console.error('Seed error:', error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 1000); // Increased debounce to prevent 429 errors
    
    return () => clearTimeout(timer);
  }, [selectedType, selectedPeriod]);

  const renderMetrics = (entry: LeaderboardEntry) => {
    if (selectedType === 'provider' && entry.providerMetrics) {
      return (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Deliveries</p>
            <p className="font-semibold">{entry.providerMetrics.successfulDeliveries}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">On-time</p>
            <p className="font-semibold">{entry.providerMetrics.onTimeDeliveryRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Rating</p>
            <p className="font-semibold flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {entry.providerMetrics.customerRating.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Revenue</p>
            <p className="font-semibold">${entry.providerMetrics.revenue.toLocaleString()}</p>
          </div>
        </div>
      );
    } else if (selectedType === 'seller' && entry.sellerMetrics) {
      return (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Orders</p>
            <p className="font-semibold">{entry.sellerMetrics.confirmedOrders}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Conversion</p>
            <p className="font-semibold">{entry.sellerMetrics.conversionRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Delivered</p>
            <p className="font-semibold">{entry.sellerMetrics.deliveredOrders}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Revenue</p>
            <p className="font-semibold">${entry.sellerMetrics.revenue.toLocaleString()}</p>
          </div>
        </div>
      );
    } else if (selectedType === 'call_center_agent' && entry.callCenterAgentMetrics) {
      return (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Confirmed</p>
            <p className="font-semibold">{entry.callCenterAgentMetrics.confirmedOrders}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Success Rate</p>
            <p className="font-semibold">{entry.callCenterAgentMetrics.callSuccessRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Satisfaction</p>
            <p className="font-semibold flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {entry.callCenterAgentMetrics.customerSatisfactionScore.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Target</p>
            <p className="font-semibold">{entry.callCenterAgentMetrics.dailyTargetAchievement.toFixed(0)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Leaderboard Management
          </h1>
          <p className="text-muted-foreground">Manage and monitor performance metrics across all user types</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={generateTestData}
            disabled={updating}
            variant="outline"
            size="sm"
          >
            {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
            Seed Data
          </Button>
          <Button 
            onClick={updateAllLeaderboards}
            disabled={updating}
            variant="outline"
            size="sm"
          >
            {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Update All
          </Button>
          <Button 
            onClick={updateLeaderboard}
            disabled={updating}
            size="sm"
          >
            {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Update Current
          </Button>
          <Button 
            onClick={resetLeaderboard}
            variant="destructive"
            size="sm"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Leaderboard Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeaderboardType.PROVIDER}>Providers</SelectItem>
                <SelectItem value={LeaderboardType.SELLER}>Sellers</SelectItem>
                <SelectItem value={LeaderboardType.CALL_CENTER_AGENT}>Call Center Agents</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeaderboardPeriod.DAILY}>Daily</SelectItem>
                <SelectItem value={LeaderboardPeriod.WEEKLY}>Weekly</SelectItem>
                <SelectItem value={LeaderboardPeriod.MONTHLY}>Monthly</SelectItem>
                <SelectItem value={LeaderboardPeriod.YEARLY}>Yearly</SelectItem>
                <SelectItem value={LeaderboardPeriod.ALL_TIME}>All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Update Notice */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm font-medium">How Leaderboard Periods Work:</p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• <strong>Daily:</strong> Shows performance for today only</li>
              <li>• <strong>Weekly:</strong> Shows performance for the current week</li>
              <li>• <strong>Monthly:</strong> Shows performance for the current month</li>
              <li>• <strong>Yearly:</strong> Aggregates ALL data from January 1 to December 31</li>
              <li>• <strong>All Time:</strong> Aggregates ALL historical data since 2020</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Each period calculates metrics from actual orders and performance data within that time range.
              Click "Update Current" to recalculate the selected period, or "Update All" to refresh all periods.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : leaderboardData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Leaderboard Data</h3>
            <p className="text-muted-foreground mb-4">No data available for the selected type and period.</p>
            <Button onClick={generateTestData} variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Generate Test Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {leaderboardData.slice(0, 3).map((entry) => (
              <LeaderboardCard
                key={entry._id}
                rank={entry.rank}
                name={entry.userId.name}
                businessName={entry.userId.businessName}
                email={entry.userId.email}
                score={entry.totalScore}
                previousRank={entry.previousRank}
                metrics={renderMetrics(entry)}
                featured={true}
              />
            ))}
          </div>

          {/* Scoring Explanation */}
          <ScoringExplanation type={selectedType as any} />

          {/* Full Rankings Table */}
          <LeaderboardTable 
            data={leaderboardData} 
            type={selectedType as any}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
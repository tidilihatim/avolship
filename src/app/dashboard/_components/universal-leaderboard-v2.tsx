'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, RefreshCw, TrendingUp, Truck, ShoppingCart, Phone, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import LeaderboardCard from './leaderboard-card';
import LeaderboardTable from './leaderboard-table';
import ScoringExplanation from './scoring-explanation';
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
  lastUpdated: string;
}

interface UniversalLeaderboardProps {
  allowedTypes: ('provider' | 'seller' | 'call_center_agent')[];
  defaultType: string;
  apiEndpoint: string;
}

export default function UniversalLeaderboardV2({ allowedTypes, defaultType, apiEndpoint }: UniversalLeaderboardProps) {
  const { data: session } = useSession();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(defaultType);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const fetchingRef = React.useRef(false);

  const fetchLeaderboard = async () => {
    if (fetchingRef.current) return; // Prevent concurrent requests
    
    fetchingRef.current = true;
    setLoading(true);
    try {
      const response = await fetch(`${apiEndpoint}?type=${selectedType}&period=${selectedPeriod}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.status === 429) {
        // Rate limited, wait and retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryResponse = await fetch(`${apiEndpoint}?type=${selectedType}&period=${selectedPeriod}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const retryData = await retryResponse.json();
        if (retryData.success) {
          setLeaderboardData(retryData.data || []);
        }
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.data || []);
      } else {
        toast.error(data.error || 'Failed to fetch leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Error loading leaderboard. Please try again.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'provider': return 'Providers';
      case 'seller': return 'Sellers';
      case 'call_center_agent': return 'Call Center Agents';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'provider': return <Truck className="w-4 h-4" />;
      case 'seller': return <ShoppingCart className="w-4 h-4" />;
      case 'call_center_agent': return <Phone className="w-4 h-4" />;
      default: return null;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 1000); // Debounce to prevent 429 errors
    
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
            Performance Leaderboard
          </h1>
          <p className="text-muted-foreground">Track top performers across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <button 
            onClick={fetchLeaderboard}
            disabled={loading}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "hover:bg-muted",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Type Tabs */}
      {allowedTypes.length > 1 ? (
        <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
          <TabsList className={cn(
            "grid w-full max-w-md",
            allowedTypes.length === 2 && "grid-cols-2",
            allowedTypes.length === 3 && "grid-cols-3"
          )}>
            {allowedTypes.map(type => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                {getTypeIcon(type)}
                <span className="hidden sm:inline">{getTypeLabel(type)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedType} className="mt-6">
            {renderLeaderboardContent()}
          </TabsContent>
        </Tabs>
      ) : (
        renderLeaderboardContent()
      )}
    </div>
  );

  function renderLeaderboardContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (leaderboardData.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Leaderboard Data Yet</h3>
            <p className="text-muted-foreground">Rankings will appear here once there is activity to track.</p>
          </CardContent>
        </Card>
      );
    }

    return (
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
    );
  }
}
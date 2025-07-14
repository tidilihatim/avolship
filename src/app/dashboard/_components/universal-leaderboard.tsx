'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, Star, RefreshCw, TrendingUp, Truck, ShoppingCart, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

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

export default function UniversalLeaderboard({ allowedTypes, defaultType, apiEndpoint }: UniversalLeaderboardProps) {
  const { data: session } = useSession();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(defaultType);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiEndpoint}?type=${selectedType}&period=${selectedPeriod}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
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
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold">{rank}</span>;
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = previous - current;
    if (change > 0) {
      return <Badge variant="secondary" className="text-green-600">↑{change}</Badge>;
    } else if (change < 0) {
      return <Badge variant="secondary" className="text-red-600">↓{Math.abs(change)}</Badge>;
    }
    return <Badge variant="secondary" className="text-gray-600">-</Badge>;
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
    fetchLeaderboard();
  }, [selectedType, selectedPeriod]);

  const renderMetrics = (entry: LeaderboardEntry) => {
    if (selectedType === 'provider' && entry.providerMetrics) {
      return (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Deliveries</p>
            <p className="font-semibold">{entry.providerMetrics.successfulDeliveries}</p>
          </div>
          <div>
            <p className="text-gray-600">On-time</p>
            <p className="font-semibold">{entry.providerMetrics.onTimeDeliveryRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Rating</p>
            <p className="font-semibold flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {entry.providerMetrics.customerRating.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Revenue</p>
            <p className="font-semibold">${entry.providerMetrics.revenue.toLocaleString()}</p>
          </div>
        </div>
      );
    } else if (selectedType === 'seller' && entry.sellerMetrics) {
      return (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Orders</p>
            <p className="font-semibold">{entry.sellerMetrics.confirmedOrders}</p>
          </div>
          <div>
            <p className="text-gray-600">Conversion</p>
            <p className="font-semibold">{entry.sellerMetrics.conversionRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Rating</p>
            <p className="font-semibold flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {entry.sellerMetrics.customerRating.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Revenue</p>
            <p className="font-semibold">${entry.sellerMetrics.revenue.toLocaleString()}</p>
          </div>
        </div>
      );
    } else if (selectedType === 'call_center_agent' && entry.callCenterAgentMetrics) {
      return (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Confirmed</p>
            <p className="font-semibold">{entry.callCenterAgentMetrics.confirmedOrders}</p>
          </div>
          <div>
            <p className="text-gray-600">Success Rate</p>
            <p className="font-semibold">{entry.callCenterAgentMetrics.callSuccessRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Satisfaction</p>
            <p className="font-semibold flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {entry.callCenterAgentMetrics.customerSatisfactionScore.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Target</p>
            <p className="font-semibold">{entry.callCenterAgentMetrics.dailyTargetAchievement.toFixed(0)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Leaderboard</h1>
          <p className="text-gray-600">Track top performers across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
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
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {allowedTypes.length > 1 ? (
        <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            {allowedTypes.map(type => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                {getTypeIcon(type)}
                {getTypeLabel(type)}
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
    if (leaderboardData.length === 0 && !loading) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Leaderboard Data Yet</h3>
            <p className="text-gray-600">Rankings will appear here once there is activity to track.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {/* Top 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {leaderboardData.slice(0, 3).map((entry, index) => (
            <Card key={entry._id} className={`${
              index === 0 ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50' : 
              index === 1 ? 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50' : 
              'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getRankIcon(entry.rank)}
                    <div>
                      <div className="font-semibold">{entry.userId.businessName || entry.userId.name}</div>
                      <div className="text-sm text-gray-500">{entry.userId.email}</div>
                    </div>
                  </div>
                  {getRankChange(entry.rank, entry.previousRank)}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Score</span>
                    <Badge variant="secondary" className="font-mono">
                      {entry.totalScore.toFixed(0)}
                    </Badge>
                  </div>
                  {renderMetrics(entry)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Complete Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Key Metrics</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.userId.businessName || entry.userId.name}</div>
                          <div className="text-sm text-gray-500">{entry.userId.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {selectedType === 'provider' && entry.providerMetrics && (
                          <div className="text-sm">
                            {entry.providerMetrics.successfulDeliveries} deliveries • {entry.providerMetrics.onTimeDeliveryRate.toFixed(0)}% on-time
                          </div>
                        )}
                        {selectedType === 'seller' && entry.sellerMetrics && (
                          <div className="text-sm">
                            {entry.sellerMetrics.confirmedOrders} orders • {entry.sellerMetrics.conversionRate.toFixed(0)}% conversion
                          </div>
                        )}
                        {selectedType === 'call_center_agent' && entry.callCenterAgentMetrics && (
                          <div className="text-sm">
                            {entry.callCenterAgentMetrics.confirmedOrders} confirmed • {entry.callCenterAgentMetrics.callSuccessRate.toFixed(0)}% success
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          {entry.totalScore.toFixed(0)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getRankChange(entry.rank, entry.previousRank)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </>
    );
  }
}
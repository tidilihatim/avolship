'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, Star, RefreshCw, Target, Phone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import LeaderboardCard from '@/app/dashboard/_components/leaderboard-card';

interface AgentLeaderboardEntry {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  rank: number;
  previousRank?: number;
  totalScore: number;
  callCenterAgentMetrics: {
    totalCalls: number;
    successfulCalls: number;
    confirmedOrders: number;
    deliveredOrders: number;
    callSuccessRate: number;
    orderConfirmationRate: number;
    customerSatisfactionScore: number;
    totalCustomerRatings: number;
    dailyTargetAchievement: number;
  };
  lastUpdated: string;
}

interface AgentLeaderboardProps {
  className?: string;
}

export default function AgentLeaderboard({ className }: AgentLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<AgentLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/call-center/leaderboard?period=${selectedPeriod}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.data);
      } else {
        toast.error('Failed to fetch agent leaderboard');
      }
    } catch (error) {
      toast.error('Error fetching agent leaderboard');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchLeaderboard();
  }, [selectedPeriod]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top Performing Agents
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={fetchLeaderboard}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No leaderboard data available for this period
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 agents - Featured display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {leaderboardData.slice(0, 3).map((entry) => (
                <LeaderboardCard
                  key={entry._id}
                  rank={entry.rank}
                  name={entry.userId.name}
                  businessName={undefined}
                  email={entry.userId.email}
                  score={entry.totalScore}
                  previousRank={entry.previousRank}
                  featured={true}
                  metrics={
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Confirmed: {entry.callCenterAgentMetrics.confirmedOrders}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span>Success: {entry.callCenterAgentMetrics.callSuccessRate.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>Rating: {entry.callCenterAgentMetrics.customerSatisfactionScore.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-purple-500" />
                        <span>Target: {entry.callCenterAgentMetrics.dailyTargetAchievement.toFixed(0)}%</span>
                      </div>
                    </div>
                  }
                />
              ))}
            </div>

            {/* Remaining agents - Table format */}
            {leaderboardData.length > 3 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Other Top Performers</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Confirmed</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboardData.slice(3).map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{entry.rank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{entry.userId.name}</div>
                            <div className="text-xs text-gray-500">{entry.userId.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {entry.totalScore.toFixed(0)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {entry.callCenterAgentMetrics.confirmedOrders}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {entry.callCenterAgentMetrics.callSuccessRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm">
                              {entry.callCenterAgentMetrics.customerSatisfactionScore.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
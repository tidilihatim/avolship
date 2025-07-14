'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, TrendingUp, Phone, Users, Award, Loader2, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Agent {
  _id: string;
  name: string;
  email: string;
}

interface AgentMetrics {
  totalCalls: number;
  successfulCalls: number;
  confirmedOrders: number;
  deliveredOrders: number;
  callSuccessRate: number;
  orderConfirmationRate: number;
  deliveryRate: number;
  avgCallDuration: number;
}

interface AgentRating {
  _id: string;
  agentId: Agent;
  adminId: { name: string; email: string };
  periodStart: string;
  periodEnd: string;
  periodType: string;
  adminBoostPercentage: number;
  adminBoostReason?: string;
  performanceScore: number;
  finalScore: number;
  performanceLevel: string;
  status: string;
  createdAt: string;
}

export default function AdminAgentRatingsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('MONTHLY');
  const [ratings, setRatings] = useState<AgentRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingAgent, setRatingAgent] = useState<Agent | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [adminBoost, setAdminBoost] = useState(0);
  const [boostReason, setBoostReason] = useState('');

  // Fetch call center agents
  const fetchAgents = async () => {
    try {
      console.log('Fetching agents...');
      const response = await fetch('/api/admin/users?role=call_center&status=approved');
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      if (data.success) {
        setAgents(data.data);
        console.log('Agents set:', data.data);
      } else {
        console.error('Failed response:', data);
        toast.error(data.error || 'Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to fetch agents');
    }
  };

  // Fetch agent ratings
  const fetchRatings = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/agent-rating';
      const params = new URLSearchParams();
      if (selectedAgent && selectedAgent !== 'all') params.append('agentId', selectedAgent);
      if (selectedPeriod) params.append('periodType', selectedPeriod);
      
      const response = await fetch(`${url}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRatings(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  };

  // Calculate agent metrics for the selected period
  const calculateAgentMetrics = async (agentId: string) => {
    try {
      // Get period dates based on selected period type
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (selectedPeriod) {
        case 'WEEKLY':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'MONTHLY':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'QUARTERLY':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'ANNUAL':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch agent\'s order metrics
      const response = await fetch(`/api/admin/orders/agent-metrics?agentId=${agentId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const data = await response.json();
      
      if (data.success) {
        setAgentMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to calculate metrics:', error);
      // Set mock data for now
      setAgentMetrics({
        totalCalls: 150,
        successfulCalls: 120,
        confirmedOrders: 85,
        deliveredOrders: 78,
        callSuccessRate: 80,
        orderConfirmationRate: 70.8,
        deliveryRate: 91.8,
        avgCallDuration: 180
      });
    }
  };

  // Open rating dialog
  const openRatingDialog = async (agent: Agent) => {
    console.log('Opening rating dialog for agent:', agent);
    setRatingAgent(agent);
    setAdminBoost(0);
    setBoostReason('');
    setAgentMetrics(null); // Reset metrics first
    setShowRatingDialog(true);
    await calculateAgentMetrics(agent._id);
  };

  // Submit rating
  const submitRating = async () => {
    if (!ratingAgent || !agentMetrics) return;

    // Calculate period dates
    const now = new Date();
    let periodStart = new Date();
    let periodEnd = new Date();
    
    switch (selectedPeriod) {
      case 'WEEKLY':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'MONTHLY':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'QUARTERLY':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case 'ANNUAL':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    const ratingData = {
      agentId: ratingAgent._id,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      periodType: selectedPeriod,
      adminBoostPercentage: adminBoost,
      adminBoostReason: boostReason,
      totalCallsHandled: agentMetrics.totalCalls,
      successfulCalls: agentMetrics.successfulCalls,
      confirmedOrders: agentMetrics.confirmedOrders,
      deliveredOrders: agentMetrics.deliveredOrders,
      avgCallDuration: agentMetrics.avgCallDuration,
      callSuccessRate: agentMetrics.callSuccessRate,
      orderConfirmationRate: agentMetrics.orderConfirmationRate,
      deliveryRate: agentMetrics.deliveryRate,
      status: 'SUBMITTED'
    };
    
    console.log('Sending rating data:', ratingData);
    
    try {
      const response = await fetch('/api/admin/agent-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Agent rating submitted successfully');
        setShowRatingDialog(false);
        fetchRatings();
      } else {
        console.error('Error response:', data);
        toast.error(data.error || 'Failed to submit rating');
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (error) {
      toast.error('Error submitting rating');
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [selectedAgent, selectedPeriod]);

  const getPerformanceBadgeColor = (level: string) => {
    switch (level) {
      case 'OUTSTANDING': return 'bg-purple-500';
      case 'EXCELLENT': return 'bg-green-500';
      case 'GOOD': return 'bg-blue-500';
      case 'SATISFACTORY': return 'bg-yellow-500';
      case 'NEEDS_IMPROVEMENT': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Calculate preview scores
  const calculatePreviewScores = () => {
    if (!agentMetrics) return { performance: 0, final: 0 };
    
    let score = 0;
    let factors = 0;
    
    if (agentMetrics.totalCalls > 0) {
      score += (agentMetrics.callSuccessRate / 100) * 5;
      factors++;
    }
    
    if (agentMetrics.confirmedOrders > 0 || agentMetrics.totalCalls > 0) {
      score += (agentMetrics.orderConfirmationRate / 100) * 5;
      factors++;
    }
    
    if (agentMetrics.confirmedOrders > 0) {
      score += (agentMetrics.deliveryRate / 100) * 5;
      factors++;
    }
    
    // Base performance score (with minimum of 1 if agent is active)
    const performanceScore = factors > 0 ? score / factors : 1;
    
    // Apply admin boost as additive bonus (each 20% = +1 star, max 5)
    const boostPoints = (adminBoost / 20);
    const finalScore = Math.min(5, performanceScore + boostPoints);
    
    return { performance: performanceScore, final: finalScore };
  };

  const previewScores = calculatePreviewScores();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Performance Ratings</h1>
          <p className="text-muted-foreground">Rate call center agents based on their performance metrics</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Period Type</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Call Center Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Latest Rating</TableHead>
                <TableHead>Performance Level</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No call center agents found</p>
                      <p className="text-sm mt-2">Make sure you have approved call center agents in the system</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                agents.map(agent => {
                  const latestRating = ratings.find(r => r.agentId._id === agent._id);
                  return (
                    <TableRow key={agent._id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell>
                        {latestRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{latestRating.finalScore.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not rated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {latestRating ? (
                          <Badge className={cn(getPerformanceBadgeColor(latestRating.performanceLevel), 'text-white')}>
                            {latestRating.performanceLevel.replace('_', ' ')}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => openRatingDialog(agent)}
                        >
                          Rate Agent
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ratings History */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Ratings History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Performance Score</TableHead>
                  <TableHead>Admin Boost</TableHead>
                  <TableHead>Final Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rated By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratings.map(rating => (
                  <TableRow key={rating._id}>
                    <TableCell>{rating.agentId.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rating.periodType}</Badge>
                    </TableCell>
                    <TableCell>{rating.performanceScore.toFixed(2)}</TableCell>
                    <TableCell>+{rating.adminBoostPercentage}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">{rating.finalScore.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rating.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                        {rating.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{rating.adminId.name}</TableCell>
                    <TableCell>{new Date(rating.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rate Agent Performance</DialogTitle>
          </DialogHeader>
          
          {ratingAgent ? (
            agentMetrics ? (
              <div className="space-y-6">
              {/* Agent Info */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold">{ratingAgent.name}</h3>
                <p className="text-sm text-muted-foreground">{ratingAgent.email}</p>
                <p className="text-sm text-muted-foreground mt-1">Period: {selectedPeriod}</p>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 className="font-semibold mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background border rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Total Calls</p>
                    <p className="text-2xl font-bold">{agentMetrics.totalCalls}</p>
                  </div>
                  <div className="bg-background border rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{agentMetrics.callSuccessRate}%</p>
                  </div>
                  <div className="bg-background border rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Confirmed Orders</p>
                    <p className="text-2xl font-bold">{agentMetrics.confirmedOrders}</p>
                  </div>
                  <div className="bg-background border rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Delivered Orders</p>
                    <p className="text-2xl font-bold">{agentMetrics.deliveredOrders}</p>
                  </div>
                </div>
              </div>

              {/* Admin Boost */}
              <div className="space-y-4">
                <div>
                  <Label>Admin Performance Boost (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={adminBoost}
                    onChange={(e) => setAdminBoost(Number(e.target.value))}
                    placeholder="0-100"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Boost the agent's rating (each 20% = +1 star, base 1 star if no metrics)
                  </p>
                </div>

                <div>
                  <Label>Reason for Boost (Optional)</Label>
                  <Textarea
                    value={boostReason}
                    onChange={(e) => setBoostReason(e.target.value)}
                    placeholder="Explain why you\'re applying this boost..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Score Preview */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Score Calculation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base Performance Score:</span>
                    <span className="font-medium">{previewScores.performance.toFixed(2)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin Boost:</span>
                    <span className="font-medium">+{(adminBoost / 20).toFixed(1)} stars ({adminBoost}%)</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Final Score:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold">{previewScores.final.toFixed(1)}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={submitRating}>
                  Submit Rating
                </Button>
              </div>
            </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2">Loading agent metrics...</span>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No agent selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
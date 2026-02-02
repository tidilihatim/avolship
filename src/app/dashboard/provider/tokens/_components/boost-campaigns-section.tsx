"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Play,
  Pause,
  Square,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  createBoostCampaign,
  getUserBoostCampaigns,
  toggleBoostCampaign,
  cancelBoostCampaign,
  getUserTokenData
} from '@/app/actions/tokens';

interface Campaign {
  id: string;
  tokensPerClick: number;
  totalTokensBudget: number;
  tokensSpent: number;
  clicksReceived: number;
  impressions: number;
  status: string;
  startDate: string;
  endDate?: string;
  clickThroughRate: number;
  remainingBudget: number;
}

export function BoostCampaignsSection() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const [campaignForm, setCampaignForm] = useState({
    tokensPerClick: 2,
    totalTokensBudget: 10,
    isAutoRenew: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignsData, tokenData] = await Promise.all([
        getUserBoostCampaigns(),
        getUserTokenData()
      ]);
      setCampaigns(campaignsData || []);
      setUserBalance(tokenData?.balance || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (campaignForm.totalTokensBudget > userBalance) {
      toast.error('Insufficient token balance');
      return;
    }

    if (campaignForm.tokensPerClick < 1 || campaignForm.tokensPerClick > 100) {
      toast.error('Tokens per click must be between 1 and 100');
      return;
    }

    if (campaignForm.totalTokensBudget < campaignForm.tokensPerClick) {
      toast.error('Budget must be at least equal to tokens per click');
      return;
    }

    startTransition(async () => {
      try {
        const result = await createBoostCampaign(campaignForm);
        
        if (result.success) {
          toast.success('Boost campaign created successfully!');
          setShowCreateDialog(false);
          setCampaignForm({
            tokensPerClick: 2,
            totalTokensBudget: 10,
            isAutoRenew: false,
          });
          fetchData();
        }
      } catch (error) {
        toast.error('Failed to create campaign');
        console.error(error);
      }
    });
  };

  const handleToggleCampaign = async (campaignId: string) => {
    startTransition(async () => {
      try {
        const result = await toggleBoostCampaign(campaignId);
        
        if (result.success) {
          toast.success(`Campaign ${result.status}`);
          fetchData();
        }
      } catch (error) {
        toast.error('Failed to update campaign');
        console.error(error);
      }
    });
  };

  const handleCancelCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to cancel this campaign? Remaining tokens will be refunded.')) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await cancelBoostCampaign(campaignId);
        
        if (result.success) {
          toast.success(`Campaign cancelled. ${result.refundedTokens} tokens refunded.`);
          fetchData();
        }
      } catch (error) {
        toast.error('Failed to cancel campaign');
        console.error(error);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, color: 'bg-green-500' },
      paused: { variant: 'secondary' as const, color: 'bg-yellow-500' },
      completed: { variant: 'outline' as const, color: 'bg-blue-500' },
      cancelled: { variant: 'destructive' as const, color: 'bg-gray-500' },
    };

    const config = variants[status as keyof typeof variants] || variants.active;
    
    return (
      <Badge variant={config.variant}>
        <div className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="h-8 bg-muted rounded" />
                  <div className="h-8 bg-muted rounded" />
                  <div className="h-8 bg-muted rounded" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Boost Campaigns</h2>
          <p className="text-muted-foreground">
            Manage your profile boost campaigns and track performance
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Boost Campaign</DialogTitle>
              <DialogDescription>
                Set up a new campaign to boost your profile visibility
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokens-per-click">Tokens per Click</Label>
                <Input
                  id="tokens-per-click"
                  type="number"
                  min="1"
                  max="100"
                  value={campaignForm.tokensPerClick}
                  onChange={(e) => setCampaignForm(prev => ({ 
                    ...prev, 
                    tokensPerClick: parseInt(e.target.value) || 1 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values = better positioning. Range: 1-100 tokens
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-budget">Total Budget (Tokens)</Label>
                <Input
                  id="total-budget"
                  type="number"
                  min="1"
                  value={campaignForm.totalTokensBudget}
                  onChange={(e) => setCampaignForm(prev => ({ 
                    ...prev, 
                    totalTokensBudget: parseInt(e.target.value) || 1 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Available balance: {userBalance} tokens
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-renew">Auto-renew Campaign</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically restart when budget is exhausted
                  </p>
                </div>
                <Switch
                  id="auto-renew"
                  checked={campaignForm.isAutoRenew}
                  onCheckedChange={(checked) => 
                    setCampaignForm(prev => ({ ...prev, isAutoRenew: checked }))
                  }
                />
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm">
                  <strong>Estimated Performance:</strong>
                  <div className="mt-1 space-y-1">
                    <div>Max clicks: {Math.floor(campaignForm.totalTokensBudget / campaignForm.tokensPerClick)}</div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={isPending || campaignForm.totalTokensBudget > userBalance}
              >
                {isPending ? 'Creating...' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Campaigns</h3>
            <p className="text-muted-foreground mb-4">
              Create your first boost campaign to increase profile visibility
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Campaign #{campaign.id.slice(-6)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Started {new Date(campaign.startDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {campaign.tokensPerClick} tokens/click
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(campaign.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{campaign.impressions}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" />
                      Impressions
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{campaign.clicksReceived}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      Clicks
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{campaign.clickThroughRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      CTR
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{campaign.remainingBudget}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Remaining
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Budget: {campaign.tokensSpent} / {campaign.totalTokensBudget} tokens used
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {campaign.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCampaign(campaign.id)}
                        disabled={isPending}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    
                    {campaign.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCampaign(campaign.id)}
                        disabled={isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    
                    {(campaign.status === 'active' || campaign.status === 'paused') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelCampaign(campaign.id)}
                        disabled={isPending}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(campaign.tokensSpent / campaign.totalTokensBudget) * 100}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Target, TrendingUp, ExternalLink, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

interface FeaturedAd {
  _id: string;
  title: string;
  description: string;
  bannerImageUrl?: string;
  ctaText: string;
  ctaLink?: string;
  status: string;
  placement: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  targetCountries?: string[];
  budget?: number;
  spent?: number;
}

interface ProviderFeaturedAdsSectionProps {
  providerId: string;
}

export function ProviderFeaturedAdsSection({ providerId }: ProviderFeaturedAdsSectionProps) {
  const [ads, setAds] = useState<FeaturedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProviderAds();
  }, [providerId]);

  const fetchProviderAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/providers/${providerId}/featured-ads`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch provider ads');
      }
      
      const data = await response.json();
      setAds(data.ads || []);
    } catch (err) {
      console.error('Error fetching provider ads:', err);
      setError('Failed to load featured ads');
    } finally {
      setLoading(false);
    }
  };

  const trackClick = async (adId: string) => {
    try {
      await fetch('/api/featured-ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const handleAdClick = async (ad: FeaturedAd) => {
    await trackClick(ad._id);
    
    if (ad.ctaLink) {
      if (ad.ctaLink.startsWith('http')) {
        window.open(ad.ctaLink, '_blank');
      } else {
        window.location.href = ad.ctaLink;
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Featured Promotions
          </CardTitle>
          <CardDescription>Active promotional campaigns by this provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null; // Silently fail if ads can't be loaded
  }

  if (ads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Featured Promotions
          </CardTitle>
          <CardDescription>Active promotional campaigns by this provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No active promotions at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return '0%';
    return `${((clicks / impressions) * 100).toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'PAUSED':
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      case 'EXPIRED':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Featured Promotions
        </CardTitle>
        <CardDescription>Active promotional campaigns by this provider</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ads.map((ad) => (
            <div 
              key={ad._id} 
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => handleAdClick(ad)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-lg">{ad.title}</h4>
                <Badge className={getStatusColor(ad.status)}>
                  {ad.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {ad.description}
              </p>
              
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(ad.startDate), 'MMM d')} - {format(new Date(ad.endDate), 'MMM d, yyyy')}</span>
                </div>
                {ad.targetCountries && ad.targetCountries.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{ad.targetCountries.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{ad.impressions} views • {ad.clicks} clicks • {getCTR(ad.impressions, ad.clicks)} CTR</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <Link 
                  href={`/dashboard/seller/featured-ads/${ad._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-primary hover:underline"
                >
                  View Details
                </Link>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick(ad);
                  }}
                >
                  {ad.ctaText}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
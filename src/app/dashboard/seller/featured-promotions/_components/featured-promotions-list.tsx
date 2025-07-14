'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Target, 
  TrendingUp, 
  ExternalLink,
  Filter,
  Search,
  Package,
  Megaphone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface FeaturedAd {
  _id: string;
  provider: {
    _id: string;
    businessName: string;
    businessInfo?: string;
    profileImage?: string;
    country?: string;
    serviceType?: string;
  };
  title: string;
  description: string;
  bannerImageUrl?: string;
  ctaText: string;
  ctaLink?: string;
  status: string;
  placement: string | string[];
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  targetCountries?: string[];
  budget?: number;
  spent?: number;
}

export function FeaturedPromotionsList() {
  const [ads, setAds] = useState<FeaturedAd[]>([]);
  const [filteredAds, setFilteredAds] = useState<FeaturedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedPlacement, setSelectedPlacement] = useState<string>('all');

  useEffect(() => {
    fetchAllAds();
  }, []);

  useEffect(() => {
    filterAds();
  }, [ads, searchTerm, selectedCountry, selectedPlacement]);

  const fetchAllAds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/featured-ads/all');
      
      if (!response.ok) {
        throw new Error('Failed to fetch ads');
      }
      
      const data = await response.json();
      setAds(data.ads || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const filterAds = () => {
    let filtered = [...ads];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ad => 
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.provider.businessName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Country filter
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(ad => 
        ad.targetCountries?.includes(selectedCountry) || 
        ad.provider.country === selectedCountry
      );
    }

    // Placement filter
    if (selectedPlacement !== 'all') {
      filtered = filtered.filter(ad => {
        const placements = Array.isArray(ad.placement) ? ad.placement : [ad.placement];
        return placements.includes(selectedPlacement);
      });
    }

    setFilteredAds(filtered);
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

  // Get unique countries from ads
  const countries = Array.from(new Set(
    ads.flatMap(ad => [
      ...(ad.targetCountries || []),
      ad.provider.country
    ].filter(Boolean))
  )).sort();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <Skeleton className="h-32 w-48 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8" />
            Featured Promotions
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover exclusive offers and promotions from our shipping providers
          </p>
        </div>
        <Link href="/dashboard/seller/providers">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Providers
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Promotions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPlacement} onValueChange={setSelectedPlacement}>
              <SelectTrigger>
                <SelectValue placeholder="All Placements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Placements</SelectItem>
                <SelectItem value="DASHBOARD_BANNER">Dashboard Banner</SelectItem>
                <SelectItem value="SEARCH_RESULTS">Search Results</SelectItem>
                <SelectItem value="SIDEBAR">Sidebar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAds.length} of {ads.length} promotions
        </p>
        <Badge variant="outline" className="text-sm">
          {filteredAds.filter(ad => ad.status === 'ACTIVE').length} Active
        </Badge>
      </div>

      {/* Ads Grid */}
      {filteredAds.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No promotions found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later for new promotions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredAds.map((ad) => (
            <Card key={ad._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Banner Image or Provider Avatar */}
                  <div className="relative w-full md:w-64 h-48 md:h-auto bg-muted">
                    {ad.bannerImageUrl ? (
                      <Image
                        src={ad.bannerImageUrl}
                        alt={ad.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {ad.provider.profileImage ? (
                          <Image
                            src={ad.provider.profileImage}
                            alt={ad.provider.businessName}
                            width={120}
                            height={120}
                            className="rounded-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-primary" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{ad.title}</h3>
                        <Link 
                          href={`/dashboard/seller/providers/${ad.provider._id}`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Building2 className="h-3 w-3" />
                          {ad.provider.businessName}
                        </Link>
                      </div>
                      <Badge className={getStatusColor(ad.status)}>
                        {ad.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {ad.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(ad.startDate), 'MMM d')} - {format(new Date(ad.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {ad.targetCountries && ad.targetCountries.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>{ad.targetCountries.join(', ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>
                          {ad.impressions} views • {ad.clicks} clicks • {getCTR(ad.impressions, ad.clicks)} CTR
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {ad.provider.serviceType && (
                          <Badge variant="secondary">
                            <Package className="mr-1 h-3 w-3" />
                            {ad.provider.serviceType}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        onClick={async () => {
                          await trackClick(ad._id);
                          if (ad.ctaLink) {
                            if (ad.ctaLink.startsWith('http')) {
                              window.open(ad.ctaLink, '_blank');
                            } else {
                              window.location.href = ad.ctaLink;
                            }
                          } else {
                            window.location.href = `/dashboard/seller/providers/${ad.provider._id}`;
                          }
                        }}
                      >
                        {ad.ctaText}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
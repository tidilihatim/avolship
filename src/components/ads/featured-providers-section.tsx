'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FeaturedProvider {
  _id: string;
  provider: {
    _id: string;
    businessName: string;
    businessInfo?: {
      description?: string;
      logo?: string;
      website?: string;
      phoneNumber?: string;
      email?: string;
      address?: string;
    };
    serviceType: string[];
    profileImage?: string;
  };
  title: string;
  description: string;
  bannerImageUrl?: string;
  ctaText: string;
  ctaLink?: string;
  placement: string[];
}

export default function FeaturedProvidersSection() {
  const [providers, setProviders] = useState<FeaturedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    fetchFeaturedProviders();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || providers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % providers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, providers.length]);

  const fetchFeaturedProviders = async () => {
    try {
      const response = await fetch('/api/featured-ads?placement=DASHBOARD_BANNER');
      if (!response.ok) throw new Error('Failed to fetch featured providers');
      
      const data = await response.json();
      setProviders(data.ads || []);
    } catch (error) {
      console.error('Error fetching featured providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % providers.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + providers.length) % providers.length);
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

  if (loading) {
    return (
      <div className="mb-8">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  const currentProvider = providers[currentIndex];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Featured Providers</h2>
        <Badge variant="secondary">Sponsored</Badge>
      </div>

      <div className="relative">
        <Card className="overflow-hidden">
          <div className="relative h-64 md:h-80">
            {currentProvider.bannerImageUrl ? (
              <Image
                src={currentProvider.bannerImageUrl}
                alt={currentProvider.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full bg-gradient-to-r from-primary/10 to-primary/5" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            <CardContent className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {currentProvider.provider.profileImage && (
                      <Image
                        src={currentProvider.provider.profileImage}
                        alt={currentProvider.provider.businessName}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-white"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{currentProvider.title}</h3>
                      <p className="text-sm opacity-90">{currentProvider.provider.businessName}</p>
                    </div>
                  </div>
                  
                  <p className="mb-3 line-clamp-2">{currentProvider.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentProvider.provider.serviceType.map((service) => (
                      <Badge key={service} variant="secondary" className="bg-white/20 text-white border-white/30">
                        {service}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    {currentProvider.provider.businessInfo?.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{currentProvider.provider.businessInfo.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {currentProvider.ctaLink ? (
                    <Button
                      asChild
                      variant="secondary"
                      className="gap-2"
                      onClick={() => trackClick(currentProvider._id)}
                    >
                      <a href={currentProvider.ctaLink} target="_blank" rel="noopener noreferrer">
                        {currentProvider.ctaText}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="secondary"
                      onClick={() => trackClick(currentProvider._id)}
                    >
                      <Link href={`/dashboard/seller/providers/${currentProvider.provider._id}`}>
                        {currentProvider.ctaText}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {providers.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {providers.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    index === currentIndex ? "bg-white w-8" : "bg-white/50"
                  )}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
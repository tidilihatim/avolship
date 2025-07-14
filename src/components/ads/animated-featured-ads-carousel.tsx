'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Pause, Play, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface FeaturedAd {
  _id: string;
  provider: {
    _id: string;
    businessName: string;
    profileImage?: string;
  };
  title: string;
  description: string;
  bannerImageUrl?: string;
  ctaText: string;
  ctaLink?: string;
}

interface AnimatedFeaturedAdsCarouselProps {
  placement?: string;
  className?: string;
  onClose?: () => void;
  animationEnabled?: boolean;
}

export default function AnimatedFeaturedAdsCarousel({ 
  placement = 'DASHBOARD_BANNER',
  className,
  onClose,
  animationEnabled = true
}: AnimatedFeaturedAdsCarouselProps) {
  const [ads, setAds] = useState<FeaturedAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAds();
  }, [placement]);

  useEffect(() => {
    if (!animationEnabled || isPaused || ads.length <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      handleNext();
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [animationEnabled, isPaused, ads.length, currentIndex]);

  const fetchAds = async () => {
    try {
      const response = await fetch(`/api/featured-ads?placement=${placement}`);
      if (!response.ok) throw new Error('Failed to fetch ads');
      
      const data = await response.json();
      setAds(data.ads || []);
    } catch (error) {
      console.error('Error fetching featured ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
      setIsTransitioning(false);
    }, 300);
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

  if (loading || ads.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "relative w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-lg overflow-hidden border border-primary/20",
      className
    )}>
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .slide-in {
          animation: slideInFromRight 0.3s ease-out forwards;
        }
        
        .slide-in-reverse {
          animation: slideInFromLeft 0.3s ease-out forwards;
        }
      `}</style>

      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 z-20 h-8 w-8 bg-background/80 hover:bg-background"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Pause/Play button */}
      {animationEnabled && ads.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 left-1 z-20 h-8 w-8 bg-background/80 hover:bg-background"
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        </Button>
      )}

      <div className="relative h-20 sm:h-24">
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            isTransitioning ? "opacity-0" : "opacity-100 slide-in"
          )}
        >
          <Link 
            href={`/dashboard/seller/providers/${ads[currentIndex].provider._id}`}
            onClick={() => trackClick(ads[currentIndex]._id)}
            className="block h-full"
          >
            <div className="relative h-full flex items-center px-4 sm:px-6 md:px-8">
              {/* Content - Text focused design */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex items-center gap-4 flex-1">
                  {/* Provider Icon/Avatar */}
                  <div className="flex-shrink-0">
                    {ads[currentIndex].provider.profileImage ? (
                      <Image
                        src={ads[currentIndex].provider.profileImage}
                        alt={ads[currentIndex].provider.businessName}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                        {ads[currentIndex].title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        by {ads[currentIndex].provider.businessName}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {ads[currentIndex].description}
                    </p>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-primary hover:text-primary/90 font-medium"
                  >
                    {ads[currentIndex].ctaText}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation arrows - smaller and positioned better for compact design */}
        {ads.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 bg-background/80 hover:bg-background"
              onClick={() => {
                setIsPaused(true);
                handlePrev();
              }}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-10 top-1/2 -translate-y-1/2 z-20 h-8 w-8 bg-background/80 hover:bg-background"
              onClick={() => {
                setIsPaused(true);
                handleNext();
              }}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </>
        )}

        {/* Dots indicator - moved to right side */}
        {ads.length > 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20">
            {ads.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentIndex 
                    ? "bg-primary w-4" 
                    : "bg-primary/30 hover:bg-primary/50 w-1.5"
                )}
                onClick={() => {
                  setIsPaused(true);
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
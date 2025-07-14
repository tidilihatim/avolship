"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdPlacement } from "@/types/featured-provider-ad";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FeaturedAd {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  ctaLink?: string;
  priority: number;
  provider: {
    _id: string;
    businessName: string;
    businessInfo?: string;
    serviceType?: string;
    profileImage?: string;
  };
}

interface FeaturedProviderBannerProps {
  placement: AdPlacement;
  className?: string;
  limit?: number;
}

export default function FeaturedProviderBanner({
  placement,
  className,
  limit = 1,
}: FeaturedProviderBannerProps) {
  const [ads, setAds] = useState<FeaturedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetchAds();
  }, [placement, limit]);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, 10000); // Rotate every 10 seconds

      return () => clearInterval(interval);
    }
  }, [ads.length]);

  const fetchAds = async () => {
    try {
      const response = await fetch(
        `/api/featured-ads?placement=${placement}&limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch ads");
      const data = await response.json();
      
      // Filter out dismissed ads
      const filteredAds = data.ads.filter(
        (ad: FeaturedAd) => !dismissed.includes(ad._id)
      );
      
      setAds(filteredAds);
    } catch (error) {
      console.error("Failed to load featured ads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (ad: FeaturedAd) => {
    // Track click
    try {
      const response = await fetch("/api/featured-ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad._id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.redirectUrl) {
          window.open(data.redirectUrl, "_blank");
        }
      }
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  const handleDismiss = (adId: string) => {
    setDismissed([...dismissed, adId]);
    setAds(ads.filter((ad) => ad._id !== adId));
  };

  if (loading || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentAdIndex];

  // Dashboard Banner Style
  if (placement === AdPlacement.DASHBOARD_BANNER) {
    return (
      <Card
        className={cn(
          "relative overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20",
          className
        )}
      >
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Featured
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleDismiss(currentAd._id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 cursor-pointer" onClick={() => handleClick(currentAd)}>
          <div className="flex items-start gap-6">
            {currentAd.provider.profileImage && (
              <div className="flex-shrink-0">
                <Image
                  src={currentAd.provider.profileImage}
                  alt={currentAd.provider.businessName}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {currentAd.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  by {currentAd.provider.businessName}
                  {currentAd.provider.serviceType && (
                    <span className="ml-2">• {currentAd.provider.serviceType}</span>
                  )}
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {currentAd.description}
              </p>
              
              <div className="flex items-center gap-4 pt-2">
                <Button size="sm" className="gap-2">
                  {currentAd.ctaText}
                  <ExternalLink className="h-3 w-3" />
                </Button>
                
                {ads.length > 1 && (
                  <div className="flex gap-1">
                    {ads.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-colors",
                          index === currentAdIndex
                            ? "bg-primary"
                            : "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Sidebar Style
  if (placement === AdPlacement.SIDEBAR) {
    return (
      <div className={cn("space-y-4", className)}>
        {ads.map((ad) => (
          <Card
            key={ad._id}
            className="relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => handleClick(ad)}
          >
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-xs"
            >
              Featured
            </Badge>
            
            <div className="p-4 space-y-3">
              {ad.imageUrl && (
                <div className="aspect-video relative rounded-md overflow-hidden">
                  <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-sm line-clamp-1">
                  {ad.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {ad.provider.businessName}
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-2">
                {ad.description}
              </p>
              
              <Button size="sm" className="w-full text-xs">
                {ad.ctaText}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Default compact style for other placements
  return (
    <div className={cn("space-y-2", className)}>
      {ads.map((ad) => (
        <Card
          key={ad._id}
          className="p-3 border-primary/20 hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => handleClick(ad)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
                <h4 className="text-sm font-medium truncate">{ad.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {ad.provider.businessName} • {ad.description}
              </p>
            </div>
            <Button size="sm" variant="ghost" className="text-xs">
              {ad.ctaText}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
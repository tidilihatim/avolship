"use client";

import { ExternalLink, Star, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FeaturedProviderCardProps {
  provider: {
    _id: string;
    businessName: string;
    businessInfo?: string;
    serviceType?: string;
    profileImage?: string;
    country?: string;
    rating?: number;
    totalOrders?: number;
  };
  ad: {
    _id: string;
    title: string;
    description: string;
    ctaText: string;
    ctaLink?: string;
  };
  onClick?: () => void;
  className?: string;
}

export default function FeaturedProviderCard({
  provider,
  ad,
  onClick,
  className,
}: FeaturedProviderCardProps) {
  const handleClick = async () => {
    // Track click
    try {
      await fetch("/api/featured-ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad._id }),
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }

    if (onClick) {
      onClick();
    } else if (ad.ctaLink) {
      window.open(ad.ctaLink, "_blank");
    } else {
      window.location.href = `/dashboard/seller/providers/${provider._id}`;
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 border-primary bg-gradient-to-br from-primary/5 to-secondary/5 hover:shadow-lg transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-primary text-primary-foreground">
          Featured Provider
        </Badge>
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-start gap-4 mt-6">
          {provider.profileImage ? (
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image
                src={provider.profileImage}
                alt={provider.businessName}
                fill
                className="rounded-lg object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="h-8 w-8 text-primary" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {provider.businessName}
            </h3>
            {provider.serviceType && (
              <p className="text-sm text-muted-foreground">
                {provider.serviceType}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-sm">
              {provider.country && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {provider.country}
                </div>
              )}
              
              {provider.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{provider.rating.toFixed(1)}</span>
                </div>
              )}
              
              {provider.totalOrders && (
                <div className="text-muted-foreground">
                  {provider.totalOrders}+ orders
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-base">{ad.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {ad.description}
          </p>
        </div>

        {provider.businessInfo && (
          <p className="text-sm text-muted-foreground line-clamp-2 italic">
            "{provider.businessInfo}"
          </p>
        )}

        <Button className="w-full gap-2" size="sm">
          {ad.ctaText}
          <ExternalLink className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
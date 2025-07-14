'use client';

import { format } from 'date-fns';
import { CalendarIcon, Eye, MousePointer, DollarSign, Target, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FeaturedProviderAd, AdStatus } from '@/types/featured-provider-ad';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface ViewAdDialogProps {
  ad: FeaturedProviderAd | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewAdDialog({ ad, open, onOpenChange }: ViewAdDialogProps) {
  if (!ad) return null;

  const getStatusVariant = (status: AdStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<AdStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [AdStatus.PENDING_APPROVAL]: 'secondary',
      [AdStatus.APPROVED]: 'default',
      [AdStatus.REJECTED]: 'destructive',
      [AdStatus.ACTIVE]: 'default',
      [AdStatus.PAUSED]: 'outline',
      [AdStatus.EXPIRED]: 'secondary',
    };
    return variants[status];
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0';
    return ((clicks / impressions) * 100).toFixed(2);
  };

  const calculateCPC = (spent: number, clicks: number) => {
    if (clicks === 0) return '0';
    return (spent / clicks).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ad Details</DialogTitle>
          <DialogDescription>
            Complete information about your featured ad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{ad.title}</h3>
              <Badge variant={getStatusVariant(ad.status)}>
                {ad.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground">{ad.description}</p>
          </div>

          {/* Banner Image */}
          {ad.bannerImageUrl && (
            <div>
              <h4 className="text-sm font-medium mb-2">Banner Image</h4>
              <div className="relative h-48 w-full rounded-lg overflow-hidden">
                <Image
                  src={ad.bannerImageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Campaign Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-2">Campaign Duration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Start: {format(new Date(ad.startDate), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>End: {format(new Date(ad.endDate), 'PPP')}</span>
                </div>
                <p className="text-muted-foreground">{ad.durationDays} days total</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Pricing</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Proposed: ${ad.proposedPrice}</span>
                </div>
                {ad.approvedPrice && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Approved: ${ad.approvedPrice}</span>
                  </div>
                )}
                <Badge variant={ad.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                  Payment: {ad.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Placement and Targeting */}
          <div>
            <h4 className="text-sm font-medium mb-2">Placement & Targeting</h4>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {ad.placement.map((place) => (
                  <Badge key={place} variant="outline">
                    <Target className="h-3 w-3 mr-1" />
                    {place.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
              {ad.targetCountries && ad.targetCountries.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Target Countries: {ad.targetCountries.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Call to Action */}
          <div>
            <h4 className="text-sm font-medium mb-2">Call to Action</h4>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                {ad.ctaText}
              </Button>
              {ad.ctaLink && (
                <a 
                  href={ad.ctaLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                >
                  {ad.ctaLink}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div>
            <h4 className="text-sm font-medium mb-4">Performance Metrics</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Impressions</span>
                </div>
                <p className="text-2xl font-bold">{ad.impressions.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MousePointer className="h-4 w-4" />
                  <span className="text-sm">Clicks</span>
                </div>
                <p className="text-2xl font-bold">{ad.clicks.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm">CTR</span>
                </div>
                <p className="text-2xl font-bold">{calculateCTR(ad.clicks, ad.impressions)}%</p>
              </div>
            </div>
            
            {ad.spentAmount > 0 && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Spent: ${ad.spentAmount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Cost per Click: ${calculateCPC(ad.spentAmount, ad.clicks)}</p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {(ad.approvalNotes || ad.rejectionReason) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Admin Notes</h4>
                {ad.approvalNotes && (
                  <p className="text-sm text-muted-foreground">{ad.approvalNotes}</p>
                )}
                {ad.rejectionReason && (
                  <p className="text-sm text-destructive">
                    Rejection Reason: {ad.rejectionReason}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {format(new Date(ad.createdAt), 'PPp')}</p>
            <p>Last Updated: {format(new Date(ad.updatedAt), 'PPp')}</p>
            {ad.approvedAt && (
              <p>Approved: {format(new Date(ad.approvedAt), 'PPp')}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProviderRatingDialogProps {
  open: boolean;
  onClose: () => void;
  sourcingRequest: {
    _id: string;
    requestNumber: string;
    productName: string;
    providerId: {
      _id: string;
      name: string;
      businessName?: string;
    };
  };
  onSuccess?: () => void;
}

interface RatingData {
  qualityScore: number;
  communicationScore: number;
  reliabilityScore: number;
  pricingScore: number;
  review: string;
  wouldRecommend: boolean;
  deliveredOnTime: boolean;
  productQualityMet: boolean;
  pricingAsAgreed: boolean;
  packagingQuality: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
}

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-colors"
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors",
                (hover || value) >= star
                  ? "fill-yellow-500 text-yellow-500"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );
};

export default function ProviderRatingDialog({ open, onClose, sourcingRequest, onSuccess }: ProviderRatingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [ratingData, setRatingData] = useState<RatingData>({
    qualityScore: 0,
    communicationScore: 0,
    reliabilityScore: 0,
    pricingScore: 0,
    review: '',
    wouldRecommend: false,
    deliveredOnTime: false,
    productQualityMet: false,
    pricingAsAgreed: false,
    packagingQuality: 'GOOD',
  });

  const handleSubmit = async () => {
    // Validate all ratings are provided
    if (
      ratingData.qualityScore === 0 ||
      ratingData.communicationScore === 0 ||
      ratingData.reliabilityScore === 0 ||
      ratingData.pricingScore === 0
    ) {
      toast.error('Please provide all ratings');
      return;
    }

    if (!ratingData.review.trim()) {
      toast.error('Please provide a review');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/seller/provider-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcingRequestId: sourcingRequest._id,
          ...ratingData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Rating submitted successfully');
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.error || 'Failed to submit rating');
      }
    } catch (error) {
      toast.error('Error submitting rating');
    } finally {
      setLoading(false);
    }
  };

  const overallScore = ratingData.qualityScore && ratingData.communicationScore && ratingData.reliabilityScore && ratingData.pricingScore
    ? ((ratingData.qualityScore + ratingData.communicationScore + ratingData.reliabilityScore + ratingData.pricingScore) / 4).toFixed(1)
    : '0.0';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Provider Experience</DialogTitle>
          <DialogDescription>
            Rate your experience with {sourcingRequest.providerId.businessName || sourcingRequest.providerId.name} for order {sourcingRequest.requestNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Ratings */}
          <div className="space-y-4">
            <StarRating
              value={ratingData.qualityScore}
              onChange={(v) => setRatingData({ ...ratingData, qualityScore: v })}
              label="Product Quality"
            />
            <StarRating
              value={ratingData.communicationScore}
              onChange={(v) => setRatingData({ ...ratingData, communicationScore: v })}
              label="Communication"
            />
            <StarRating
              value={ratingData.reliabilityScore}
              onChange={(v) => setRatingData({ ...ratingData, reliabilityScore: v })}
              label="Reliability"
            />
            <StarRating
              value={ratingData.pricingScore}
              onChange={(v) => setRatingData({ ...ratingData, pricingScore: v })}
              label="Pricing"
            />
          </div>

          {/* Overall Score Display */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Score</span>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                <span className="text-lg font-bold">{overallScore}</span>
              </div>
            </div>
          </div>

          {/* Boolean Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Delivered on time?</Label>
              <Select
                value={ratingData.deliveredOnTime ? 'yes' : 'no'}
                onValueChange={(v) => setRatingData({ ...ratingData, deliveredOnTime: v === 'yes' })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Product quality met expectations?</Label>
              <Select
                value={ratingData.productQualityMet ? 'yes' : 'no'}
                onValueChange={(v) => setRatingData({ ...ratingData, productQualityMet: v === 'yes' })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Pricing as agreed?</Label>
              <Select
                value={ratingData.pricingAsAgreed ? 'yes' : 'no'}
                onValueChange={(v) => setRatingData({ ...ratingData, pricingAsAgreed: v === 'yes' })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Packaging quality</Label>
              <Select
                value={ratingData.packagingQuality}
                onValueChange={(v) => setRatingData({ ...ratingData, packagingQuality: v as any })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POOR">Poor</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Would you recommend this provider?</Label>
              <Select
                value={ratingData.wouldRecommend ? 'yes' : 'no'}
                onValueChange={(v) => setRatingData({ ...ratingData, wouldRecommend: v === 'yes' })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label>Written Review</Label>
            <Textarea
              placeholder="Share your experience working with this provider..."
              value={ratingData.review}
              onChange={(e) => setRatingData({ ...ratingData, review: e.target.value })}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {ratingData.review.length}/1000 characters
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Rating'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
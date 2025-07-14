"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FeaturedProviderAd, AdStatus } from "@/types/featured-provider-ad";
import { format } from "date-fns";

interface ViewAdDialogProps {
  ad: FeaturedProviderAd | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewAdDialog({ ad, open, onOpenChange }: ViewAdDialogProps) {
  if (!ad) return null;

  const getStatusBadge = (status: AdStatus) => {
    const variants: Record<AdStatus, "default" | "secondary" | "outline" | "destructive"> = {
      [AdStatus.PENDING_APPROVAL]: "secondary",
      [AdStatus.APPROVED]: "default",
      [AdStatus.REJECTED]: "destructive",
      [AdStatus.ACTIVE]: "default",
      [AdStatus.PAUSED]: "secondary",
      [AdStatus.EXPIRED]: "outline",
    };

    const labels: Record<AdStatus, string> = {
      [AdStatus.PENDING_APPROVAL]: "Pending Approval",
      [AdStatus.APPROVED]: "Approved",
      [AdStatus.REJECTED]: "Rejected",
      [AdStatus.ACTIVE]: "Active",
      [AdStatus.PAUSED]: "Paused",
      [AdStatus.EXPIRED]: "Expired",
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return "0%";
    return `${((clicks / impressions) * 100).toFixed(2)}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Featured Ad Details</DialogTitle>
          <DialogDescription>
            View complete details of the featured advertisement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-semibold mb-3">Ad Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title:</span>
                <span className="font-medium">{ad.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                {getStatusBadge(ad.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge variant={ad.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                  {ad.paymentStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <span>{ad.priority}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-sm">{ad.description}</p>
          </div>

          <Separator />

          {/* Provider Information */}
          <div>
            <h3 className="font-semibold mb-3">Provider Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Name:</span>
                <span>{ad.provider.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{ad.provider.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Type:</span>
                <span>{Array.isArray(ad.provider.serviceType) ? ad.provider.serviceType.join(', ') : ad.provider.serviceType || 'N/A'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Placement & Targeting */}
          <div>
            <h3 className="font-semibold mb-3">Placement & Targeting</h3>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Placements:</span>
                <div className="flex gap-2 mt-1">
                  {ad.placement.map(p => (
                    <Badge key={p} variant="outline">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              {ad.targetCountries && ad.targetCountries.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Target Countries:</span>
                  <div className="flex gap-2 mt-1">
                    {ad.targetCountries.map(country => (
                      <Badge key={country} variant="outline">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing & Duration */}
          <div>
            <h3 className="font-semibold mb-3">Pricing & Duration</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proposed Price:</span>
                <span className="font-medium">${ad.proposedPrice}</span>
              </div>
              {ad.approvedPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved Price:</span>
                  <span className="font-medium text-green-600">${ad.approvedPrice}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{ad.durationDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date:</span>
                <span>{format(new Date(ad.startDate), 'PPP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span>{format(new Date(ad.endDate), 'PPP')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div>
            <h3 className="font-semibold mb-3">Performance Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impressions:</span>
                <span>{ad.impressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clicks:</span>
                <span>{ad.clicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Click-through Rate:</span>
                <span>{calculateCTR(ad.clicks, ad.impressions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spent Amount:</span>
                <span>${ad.spentAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          {ad.rejectionReason && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Rejection Reason</h3>
                <p className="text-sm text-destructive">{ad.rejectionReason}</p>
              </div>
            </>
          )}

          {/* Payment Notes */}
          {ad.paymentNotes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Payment Notes</h3>
                <p className="text-sm">{ad.paymentNotes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div>
            <h3 className="font-semibold mb-3">Metadata</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created At:</span>
                <span>{format(new Date(ad.createdAt), 'PPP p')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Modified:</span>
                <span>{format(new Date(ad.updatedAt), 'PPP p')}</span>
              </div>
              {ad.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved At:</span>
                  <span>{format(new Date(ad.approvedAt), 'PPP p')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
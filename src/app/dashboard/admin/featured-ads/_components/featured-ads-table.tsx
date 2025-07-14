"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash, Pause, Play, Eye, Check, X, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdStatus, FeaturedProviderAd } from "@/types/featured-provider-ad";
import { Skeleton } from "@/components/ui/skeleton";
import ApprovalDialog from "./approval-dialog";
import ViewAdDialog from "./view-ad-dialog";

export default function FeaturedAdsTable() {
  const [ads, setAds] = useState<FeaturedProviderAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<FeaturedProviderAd | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch("/api/admin/featured-ads");
      if (!response.ok) throw new Error("Failed to fetch ads");
      const data = await response.json();
      setAds(data.ads);
    } catch (error) {
      toast.error("Failed to load featured ads");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (ad: FeaturedProviderAd) => {
    setSelectedAd(ad);
    setApprovalDialogOpen(true);
  };

  const handleViewDetails = (ad: FeaturedProviderAd) => {
    setSelectedAd(ad);
    setViewDialogOpen(true);
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      const response = await fetch("/api/admin/featured-ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          status: AdStatus.REJECTED,
          rejectionReason: reason 
        }),
      });

      if (!response.ok) throw new Error("Failed to reject ad");
      
      toast.success("Ad rejected successfully");
      fetchAds();
    } catch (error) {
      toast.error("Failed to reject ad");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;

    try {
      const response = await fetch(`/api/admin/featured-ads?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete ad");
      
      toast.success("Ad deleted successfully");
      fetchAds();
    } catch (error) {
      toast.error("Failed to delete ad");
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const response = await fetch("/api/admin/featured-ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          paymentStatus: 'PAID',
          paymentNotes: 'Marked as paid by admin' 
        }),
      });

      if (!response.ok) throw new Error("Failed to update payment status");
      
      toast.success("Payment status updated successfully");
      fetchAds();
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

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

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      PENDING: "secondary",
      PAID: "default",
      REFUNDED: "outline",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return "0%";
    return `${((clicks / impressions) * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No featured ads yet.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Ad Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pricing</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => (
            <TableRow key={ad._id}>
              <TableCell>
                <div>
                  <p className="font-medium">{ad.provider.businessName}</p>
                  <p className="text-sm text-muted-foreground">{ad.provider.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  <p className="font-medium truncate">{ad.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{ad.description}</p>
                  <div className="flex gap-1 mt-1">
                    {ad.placement.map(p => (
                      <Badge key={p} variant="outline" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {getStatusBadge(ad.status)}
                  {ad.rejectionReason && (
                    <p className="text-xs text-destructive">
                      {ad.rejectionReason}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>Proposed: ${ad.proposedPrice}</p>
                  {ad.approvedPrice && (
                    <p className="text-green-600">Approved: ${ad.approvedPrice}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{ad.durationDays} days</p>
                  <p className="text-muted-foreground">
                    {format(new Date(ad.startDate), "MMM d")} - {format(new Date(ad.endDate), "MMM d")}
                  </p>
                </div>
              </TableCell>
              <TableCell>{getPaymentBadge(ad.paymentStatus)}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{ad.impressions.toLocaleString()} views</p>
                  <p>{ad.clicks.toLocaleString()} clicks</p>
                  <p className="text-muted-foreground">CTR: {calculateCTR(ad.clicks, ad.impressions)}</p>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleViewDetails(ad)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    
                    {ad.status === AdStatus.PENDING_APPROVAL && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleApprove(ad)}>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleReject(ad._id)}
                          className="text-red-600"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {ad.status === AdStatus.APPROVED && ad.paymentStatus === 'PENDING' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleMarkAsPaid(ad._id)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(ad._id)}
                      className="text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedAd && (
        <>
          <ApprovalDialog
            ad={selectedAd}
            open={approvalDialogOpen}
            onOpenChange={setApprovalDialogOpen}
            onSuccess={fetchAds}
          />
          <ViewAdDialog
            ad={selectedAd}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />
        </>
      )}
    </>
  );
}
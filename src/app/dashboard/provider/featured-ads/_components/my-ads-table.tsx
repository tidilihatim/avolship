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
import { MoreHorizontal, Edit, Eye, Pause, Play, Trash } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdStatus, FeaturedProviderAd } from "@/types/featured-provider-ad";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import ViewAdDialog from "./view-ad-dialog";

export default function MyAdsTable() {
  const [ads, setAds] = useState<FeaturedProviderAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<FeaturedProviderAd | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    fetchMyAds();
  }, []);

  const fetchMyAds = async () => {
    try {
      const response = await fetch("/api/provider/featured-ads");
      if (!response.ok) throw new Error("Failed to fetch ads");
      const data = await response.json();
      setAds(data.ads);
    } catch (error) {
      toast.error("Failed to load your ads");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: AdStatus) => {
    if (currentStatus !== AdStatus.ACTIVE && currentStatus !== AdStatus.PAUSED) {
      toast.error("You can only pause or resume active ads");
      return;
    }

    const newStatus = currentStatus === AdStatus.ACTIVE ? AdStatus.PAUSED : AdStatus.ACTIVE;
    
    try {
      const response = await fetch(`/api/provider/featured-ads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      
      toast.success(`Ad ${newStatus === AdStatus.ACTIVE ? "resumed" : "paused"} successfully`);
      fetchMyAds();
    } catch (error) {
      toast.error("Failed to update ad status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;

    try {
      const response = await fetch(`/api/provider/featured-ads/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete ad");
      
      toast.success("Ad deleted successfully");
      fetchMyAds();
    } catch (error) {
      toast.error("Failed to delete ad");
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
        <p className="text-muted-foreground">You haven't created any ads yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Click "Create New Ad" to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Pricing</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Performance</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ads.map((ad) => (
          <TableRow key={ad._id}>
            <TableCell>
              <div className="max-w-xs">
                <p className="font-medium truncate">{ad.title}</p>
                <p className="text-sm text-muted-foreground truncate">{ad.description}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {getStatusBadge(ad.status)}
                {ad.rejectionReason && (
                  <p className="text-xs text-destructive">
                    Reason: {ad.rejectionReason}
                  </p>
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
            <TableCell>
              <div className="text-sm">
                <p>Proposed: ${ad.proposedPrice}</p>
                {ad.approvedPrice && (
                  <p className="text-green-600">Approved: ${ad.approvedPrice}</p>
                )}
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
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedAd(ad);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {ad.status === AdStatus.PENDING_APPROVAL && (
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {(ad.status === AdStatus.ACTIVE || ad.status === AdStatus.PAUSED) && (
                    <DropdownMenuItem
                      onClick={() => handleStatusToggle(ad._id, ad.status)}
                    >
                      {ad.status === AdStatus.ACTIVE ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause Ad
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume Ad
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {ad.status === AdStatus.PENDING_APPROVAL && (
                    <DropdownMenuItem
                      onClick={() => handleDelete(ad._id)}
                      className="text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      </Table>

      <ViewAdDialog
        ad={selectedAd}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </>
  );
}
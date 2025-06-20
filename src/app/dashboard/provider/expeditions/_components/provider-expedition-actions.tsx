"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { 
  Truck, 
  CheckCircle, 
  Hash, 
  Calendar,
  Package2
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ExpeditionStatus } from "@/app/dashboard/_constant/expedition";
import { updateProviderExpeditionStatus } from "@/app/actions/expedition";

interface ProviderExpeditionActionsProps {
  expedition: any;
}

export default function ProviderExpeditionActions({ expedition }: ProviderExpeditionActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [selectedStatus, setSelectedStatus] = useState<ExpeditionStatus | "">("");
  const [trackingNumber, setTrackingNumber] = useState(expedition.trackingNumber || "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    expedition.estimatedDelivery ? new Date(expedition.estimatedDelivery).toISOString().split('T')[0] : ""
  );
  const [actualDelivery, setActualDelivery] = useState(
    expedition.actualDelivery ? new Date(expedition.actualDelivery).toISOString().split('T')[0] : ""
  );

  // Available status transitions for providers
  const getAvailableStatuses = () => {
    if (expedition.status === ExpeditionStatus.APPROVED) {
      return [ExpeditionStatus.IN_TRANSIT];
    }
    if (expedition.status === ExpeditionStatus.IN_TRANSIT) {
      return [ExpeditionStatus.DELIVERED];
    }
    return [];
  };

  const availableStatuses = getAvailableStatuses();

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProviderExpeditionStatus(
        expedition._id,
        selectedStatus,
        trackingNumber || undefined,
        estimatedDelivery || undefined,
        selectedStatus === ExpeditionStatus.DELIVERED ? (actualDelivery || new Date().toISOString()) : undefined
      );

      if (result.success) {
        toast.success(t("expeditions.expeditionUpdated"));
        setIsDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update expedition status");
      }
    } catch (error) {
      toast.error("An error occurred while updating the expedition");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: ExpeditionStatus) => {
    switch (status) {
      case ExpeditionStatus.IN_TRANSIT:
        return "Mark as In Transit";
      case ExpeditionStatus.DELIVERED:
        return "Mark as Delivered";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: ExpeditionStatus) => {
    switch (status) {
      case ExpeditionStatus.IN_TRANSIT:
        return <Truck className="h-4 w-4" />;
      case ExpeditionStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ExpeditionStatus) => {
    switch (status) {
      case ExpeditionStatus.IN_TRANSIT:
        return "text-blue-600 hover:text-blue-700";
      case ExpeditionStatus.DELIVERED:
        return "text-green-600 hover:text-green-700";
      default:
        return "text-gray-600 hover:text-gray-700";
    }
  };

  if (availableStatuses.length === 0) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Package2 className="h-4 w-4" />
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Expedition Status</DialogTitle>
          <DialogDescription>
            Update the status and tracking information for expedition {expedition.expeditionCode}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ExpeditionStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      {getStatusLabel(status)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <div className="relative">
              <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="trackingNumber"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {selectedStatus === ExpeditionStatus.IN_TRANSIT && (
            <div className="grid gap-2">
              <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="estimatedDelivery"
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}

          {selectedStatus === ExpeditionStatus.DELIVERED && (
            <div className="grid gap-2">
              <Label htmlFor="actualDelivery">Actual Delivery Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="actualDelivery"
                  type="date"
                  value={actualDelivery}
                  onChange={(e) => setActualDelivery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            disabled={isLoading || !selectedStatus}
            className={selectedStatus ? getStatusColor(selectedStatus) : ""}
          >
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
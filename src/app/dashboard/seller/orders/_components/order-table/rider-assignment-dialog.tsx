"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Truck, User, MapPin, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAvailableRiders } from "@/app/actions/call-center";
import { OrderTableData } from "./order-table-types";

interface RiderAssignmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderTableData | null;
  selectedRider: string;
  onSelectedRiderChange: (riderId: string) => void;
  isAssigning: boolean;
  onAssign: () => void;
}

interface DeliveryRider {
  _id: string;
  name: string;
  email: string;
  country: string;
}

export default function RiderAssignmentDialog({
  isOpen,
  onOpenChange,
  order,
  selectedRider,
  onSelectedRiderChange,
  isAssigning,
  onAssign,
}: RiderAssignmentDialogProps) {
  const t = useTranslations();
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);

  // Fetch riders when dialog opens and we have an order
  useEffect(() => {
    if (isOpen && order?.warehouseCountry) {
      fetchRiders(order.warehouseCountry);
    }
  }, [isOpen, order?.warehouseCountry]);

  const fetchRiders = async (country: string) => {
    setIsLoadingRiders(true);
    try {
      const result = await getAvailableRiders(country);
      if (result.success) {
        setRiders(result.riders || []);
      } else {
        toast.error(result.message || "Failed to fetch delivery riders");
        setRiders([]);
      }
    } catch (error) {
      console.error("Error fetching riders:", error);
      toast.error("Failed to fetch delivery riders");
      setRiders([]);
    } finally {
      setIsLoadingRiders(false);
    }
  };

  const handleAssign = () => {
    if (!selectedRider) {
      toast.error("Please select a delivery rider");
      return;
    }
    onAssign();
  };

  const selectedRiderInfo = riders.find(rider => rider._id === selectedRider);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[600px] h-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Assign Delivery Rider
          </DialogTitle>
          <DialogDescription>
            Select a delivery rider to assign to this order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Info */}
          {order && (
            <div className="p-6 bg-muted rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">Order #{order.orderId}</span>
                <Badge variant="secondary" className="px-3 py-1">{order.status}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{order.customer.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{order.warehouseCountry}</span>
                </div>
              </div>
            </div>
          )}

          {/* Rider Selection */}
          <div className="space-y-4">
            <label htmlFor="rider-select" className="text-base font-semibold">
              Select Delivery Rider
            </label>
            {isLoadingRiders ? (
              <div className="flex flex-col items-center justify-center p-12 bg-muted/50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="mt-3 text-muted-foreground">Loading riders...</span>
              </div>
            ) : (
              <Select
                value={selectedRider}
                onValueChange={onSelectedRiderChange}
                disabled={isAssigning}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose a delivery rider" />
                </SelectTrigger>
                <SelectContent>
                  {riders.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div>No delivery riders available in {order?.warehouseCountry}</div>
                    </div>
                  ) : (
                    riders.map((rider) => (
                      <SelectItem key={rider._id} value={rider._id} className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{rider.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {rider.email}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Rider Info */}
          {selectedRiderInfo && (
            <div className="p-5 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-green-800 text-lg">
                    {selectedRiderInfo.name}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    {selectedRiderInfo.email} • {selectedRiderInfo.country}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
            className="h-11 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedRider || isAssigning || isLoadingRiders}
            className="h-11 px-6"
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Truck className="mr-2 h-4 w-4" />
                Assign Rider
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
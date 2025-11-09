"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { OrderStatus } from "@/lib/db/models/order";
import { updateOrderStatus } from "@/app/actions/order";

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderId: string;
    status: OrderStatus;
    sellerId: string;
    warehouseId: string;
    products: Array<{
      productId: string;
      productName: string;
      productCode: string;
      quantity: number;
      unitPrice: number;
    }>;
    totalPrice: number;
    priceAdjustments?: Array<any>;
    finalTotalPrice?: number;
    totalDiscountAmount?: number;
    warehouseCurrency: string;
  };
  onStatusUpdated?: () => void;
}

export default function StatusUpdateDialog({
  isOpen,
  onClose,
  order,
  onStatusUpdated,
}: StatusUpdateDialogProps) {
  const t = useTranslations("orders");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [comment, setComment] = useState("");
  const [updateStock, setUpdateStock] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Helper function to determine if status requires stock increase
  const shouldIncreaseStock = (status: OrderStatus): boolean => {
    return [
      OrderStatus.DELIVERY_FAILED,
      OrderStatus.REFUNDED,
      OrderStatus.UNREACHED,
      OrderStatus.CANCELLED,
      OrderStatus.CANCELLED_AT_DELIVERY,
      OrderStatus.UNREACHABLE,
      OrderStatus.MISTAKEN_ORDER,
      OrderStatus.OUT_OF_DELIVERY_ZONE,
      OrderStatus.ALREADY_RECEIVED,
      OrderStatus.RETURNED,
      OrderStatus.REFUND_IN_PROGRESS
    ].includes(status);
  };


  const handleSubmit = () => {
    if (selectedStatus === order.status && !comment.trim()) {
      toast.error(t("statusUpdate.noChangesMessage"));
      return;
    }
    startTransition(async () => {
      try {
        // Update order status with stock movement control
        const result = await updateOrderStatus(order._id, selectedStatus, comment, undefined, updateStock);
        
        if (result?.success) {
          toast.success(t("statusUpdate.successMessage"));
          onStatusUpdated?.();
          onClose();
          // Reset form
          setComment("");
          setUpdateStock(true);
          setSelectedStatus(order.status);
        } else {
          toast.error(result?.message || t("statusUpdate.errorMessage"));
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        toast.error(t("statusUpdate.errorMessage"));
      }
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setSelectedStatus(order.status);
    setComment("");
    setUpdateStock(true);
  };

  // Get status badge styling
  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.PENDING]: {
        label: t("statuses.pending"),
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      },
      [OrderStatus.CONFIRMED]: {
        label: t("statuses.confirmed"),
        className: "bg-green-50 text-green-700 border-green-200",
      },
      [OrderStatus.SHIPPED]: {
        label: t("statuses.shipped"),
        className: "bg-blue-50 text-blue-700 border-blue-200",
      },
      [OrderStatus.ASSIGNED_TO_DELIVERY]: {
        label: "Assigned to Delivery",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200",
      },
      [OrderStatus.ACCEPTED_BY_DELIVERY]: {
        label: "Accepted by Delivery",
        className: "bg-teal-50 text-teal-700 border-teal-200",
      },
      [OrderStatus.IN_TRANSIT]: {
        label: "In Transit",
        className: "bg-cyan-50 text-cyan-700 border-cyan-200",
      },
      [OrderStatus.OUT_FOR_DELIVERY]: {
        label: "Out for Delivery",
        className: "bg-sky-50 text-sky-700 border-sky-200",
      },
      [OrderStatus.DELIVERED]: {
        label: t("statuses.delivered"),
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      [OrderStatus.DELIVERY_FAILED]: {
        label: "Delivery Failed",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      },
      [OrderStatus.REFUNDED]: {
        label: t("statuses.refunded"),
        className: "bg-amber-50 text-amber-700 border-amber-200",
      },
      [OrderStatus.CANCELLED]: {
        label: t("statuses.cancelled"),
        className: "bg-red-50 text-red-700 border-red-200",
      },
      [OrderStatus.WRONG_NUMBER]: {
        label: t("statuses.wrong_number"),
        className: "bg-orange-50 text-orange-700 border-orange-200",
      },
      [OrderStatus.DOUBLE]: {
        label: t("statuses.double"),
        className: "bg-purple-50 text-purple-700 border-purple-200",
      },
      [OrderStatus.UNREACHED]: {
        label: t("statuses.unreached"),
        className: "bg-gray-50 text-gray-700 border-gray-200",
      },
      [OrderStatus.EXPIRED]: {
        label: t("statuses.expired"),
        className: "bg-slate-50 text-slate-700 border-slate-200",
      },
      [OrderStatus.CANCELLED_AT_DELIVERY]: {
        label: t("statuses.cancelled_at_delivery"),
        className: "bg-red-50 text-red-700 border-red-200",
      },
      [OrderStatus.BUSY]: {
        label: t("statuses.busy"),
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      },
      [OrderStatus.UNREACHABLE]: {
        label: t("statuses.unreachable"),
        className: "bg-gray-50 text-gray-700 border-gray-200",
      },
      [OrderStatus.NO_ANSWER]: {
        label: t("statuses.no_answer"),
        className: "bg-gray-50 text-gray-700 border-gray-200",
      },
      [OrderStatus.ASKING_FOR_DISCOUNT]: {
        label: t("statuses.asking_for_discount"),
        className: "bg-amber-50 text-amber-700 border-amber-200",
      },
      [OrderStatus.NOT_READY]: {
        label: t("statuses.not_ready"),
        className: "bg-orange-50 text-orange-700 border-orange-200",
      },
      [OrderStatus.MISTAKEN_ORDER]: {
        label: t("statuses.mistaken_order"),
        className: "bg-red-50 text-red-700 border-red-200",
      },
      [OrderStatus.OUT_OF_DELIVERY_ZONE]: {
        label: t("statuses.out_of_delivery_zone"),
        className: "bg-rose-50 text-rose-700 border-rose-200",
      },
      [OrderStatus.IN_PREPARATION]: {
        label: t("statuses.in_preparation"),
        className: "bg-blue-50 text-blue-700 border-blue-200",
      },
      [OrderStatus.AWAITING_DISPATCH]: {
        label: t("statuses.awaiting_dispatch"),
        className: "bg-indigo-50 text-indigo-700 border-indigo-200",
      },
      [OrderStatus.PAID]: {
        label: t("statuses.paid"),
        className: "bg-green-50 text-green-700 border-green-200",
      },
      [OrderStatus.ALREADY_RECEIVED]: {
        label: t("statuses.already_received"),
        className: "bg-purple-50 text-purple-700 border-purple-200",
      },
      [OrderStatus.RETURN_IN_PROGRESS]: {
        label: t("statuses.return_in_progress"),
        className: "bg-orange-50 text-orange-700 border-orange-200",
      },
      [OrderStatus.RETURNED]: {
        label: t("statuses.returned"),
        className: "bg-red-50 text-red-700 border-red-200",
      },
      [OrderStatus.PROCESSED]: {
        label: t("statuses.processed"),
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      [OrderStatus.REFUND_IN_PROGRESS]: {
        label: t("statuses.refund_in_progress"),
        className: "bg-amber-50 text-amber-700 border-amber-200",
      },
    };

    return statusConfig[status] || {
      label: t("statuses.unknown"),
      className: "bg-gray-50 text-gray-700 border-gray-200",
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">{t("statusUpdate.title")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("statusUpdate.description", { orderId: order.orderId })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t("statusUpdate.currentStatus")}</Label>
              <Badge
                variant="outline"
                className={`${getStatusBadge(order.status).className} px-3 py-1 text-sm`}
              >
                {getStatusBadge(order.status).label}
              </Badge>
            </div>

            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-medium">{t("statusUpdate.newStatus")}</Label>
              <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value as OrderStatus); setComment("");}}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("statusUpdate.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OrderStatus)
                    .filter((status) => status !== OrderStatus.DOUBLE)
                    .map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusBadge(status).label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock Update Checkbox - Only show for statuses that affect stock */}
          {shouldIncreaseStock(selectedStatus) && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="updateStock"
                checked={updateStock}
                onCheckedChange={(checked) => setUpdateStock(checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="updateStock" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Update stock levels
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically return stock to inventory when changing to this status. 
                  This will increase stock quantities for all products in this order.
                </p>
              </div>
            </div>
          )}

          {/* Comment Section */}
          <div className="space-y-3">
            <Label htmlFor="comment" className="text-sm font-medium">{t("statusUpdate.comment")}</Label>
            <Textarea
              id="comment"
              placeholder={t("statusUpdate.commentPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-6">
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? t("statusUpdate.updating") : t("statusUpdate.updateStatus")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
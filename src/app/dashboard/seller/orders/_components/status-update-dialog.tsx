"use client";

import { useState, useTransition } from "react";
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
import { OrderStatus } from "@/lib/db/models/order";
import { updateOrderStatus } from "@/app/actions/order";

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderId: string;
    status: OrderStatus;
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
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (selectedStatus === order.status && !comment.trim()) {
      toast.error(t("statusUpdate.noChangesMessage"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateOrderStatus(order._id, selectedStatus, comment);
        
        if (result.success) {
          toast.success(t("statusUpdate.successMessage"));
          onStatusUpdated?.();
          onClose();
          // Reset form
          setComment("");
          setSelectedStatus(order.status);
        } else {
          toast.error(result.message || t("statusUpdate.errorMessage"));
        }
      } catch (error) {
        toast.error(t("statusUpdate.errorMessage"));
      }
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setSelectedStatus(order.status);
    setComment("");
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
    };

    return statusConfig[status] || {
      label: t("statuses.unknown"),
      className: "bg-gray-50 text-gray-700 border-gray-200",
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("statusUpdate.title")}</DialogTitle>
          <DialogDescription>
            {t("statusUpdate.description", { orderId: order.orderId })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>{t("statusUpdate.currentStatus")}</Label>
            <Badge
              variant="outline"
              className={getStatusBadge(order.status).className}
            >
              {getStatusBadge(order.status).label}
            </Badge>
          </div>

          {/* New Status */}
          <div className="space-y-2">
            <Label htmlFor="status">{t("statusUpdate.newStatus")}</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as OrderStatus)}>
              <SelectTrigger>
                <SelectValue placeholder={t("statusUpdate.selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrderStatus)
                  .filter((status) => status !== OrderStatus.DOUBLE) // Don't allow manual double status
                  .map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusBadge(status).label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">{t("statusUpdate.comment")}</Label>
            <Textarea
              id="comment"
              placeholder={t("statusUpdate.commentPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
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
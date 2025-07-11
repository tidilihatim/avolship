"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Percent, Calculator } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { OrderStatus } from "@/lib/db/models/order";
import { updateOrderStatus } from "@/app/actions/order";
import { DiscountApplication, DiscountReason, DISCOUNT_REASON_LABELS } from "@/types/discount";
import { formatPrice } from "@/lib/utils";

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderId: string;
    status: OrderStatus;
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
  const [isPending, startTransition] = useTransition();
  const [discounts, setDiscounts] = useState<Record<string, DiscountApplication>>({});

  // Check if we should show discount section
  const showDiscountSection = selectedStatus === OrderStatus.CONFIRMED;

  // Discount helper functions
  const handleProductDiscountChange = (productId: string, field: keyof DiscountApplication, value: any) => {
    setDiscounts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
        productId,
      }
    }));
  };

  const calculateDiscountAmount = (productId: string, newPrice: number) => {
    const product = order.products.find((p: any) => p.productId === productId);
    if (!product) return 0;
    
    const originalPrice = product.unitPrice;
    const discountAmount = originalPrice - newPrice;
    
    handleProductDiscountChange(productId, 'originalPrice', originalPrice);
    handleProductDiscountChange(productId, 'newPrice', newPrice);
    handleProductDiscountChange(productId, 'discountAmount', discountAmount);
    
    return discountAmount;
  };

  const getTotalDiscount = () => {
    return Object.values(discounts).reduce((total, discount) => {
      const product = order.products.find((p: any) => p.productId === discount.productId);
      if (!product || !discount.discountAmount) return total;
      return total + (discount.discountAmount * product.quantity);
    }, 0);
  };

  const getOriginalTotal = () => {
    return order.products.reduce((total: number, product: any) => {
      return total + (product.unitPrice * product.quantity);
    }, 0);
  };

  const getFinalTotal = () => {
    return getOriginalTotal() - getTotalDiscount();
  };

  const handleSubmit = () => {
    if (selectedStatus === order.status && !comment.trim() && getTotalDiscount() === 0) {
      toast.error(t("statusUpdate.noChangesMessage"));
      return;
    }

    startTransition(async () => {
      try {
        // Prepare discount data if confirming with discounts
        let discountData = null;
        if (showDiscountSection && getTotalDiscount() > 0) {
          const validDiscounts = Object.values(discounts).filter(d => 
            d.newPrice && d.newPrice < d.originalPrice && d.reason
          );
          
          if (validDiscounts.length > 0) {
            discountData = {
              discounts: validDiscounts,
              totalDiscount: getTotalDiscount(),
              finalTotal: getFinalTotal()
            };
          }
        }

        const result = await updateOrderStatus(order._id, selectedStatus, comment, discountData || undefined);
        
        if (result.success) {
          toast.success(t("statusUpdate.successMessage"));
          onStatusUpdated?.();
          onClose();
          // Reset form
          setComment("");
          setSelectedStatus(order.status);
          setDiscounts({});
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
    setDiscounts({});
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
      [OrderStatus.DELIVERED]: {
        label: t("statuses.delivered"),
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      [OrderStatus.REFUNDED]: {
        label: t("statuses.refunded"),
        className: "bg-indigo-50 text-indigo-700 border-indigo-200",
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
      <DialogContent className={`${showDiscountSection ? 'sm:max-w-4xl max-h-[90vh] overflow-y-auto' : 'sm:max-w-[425px]'}`}>
        <DialogHeader>
          <DialogTitle>{t("statusUpdate.title")}</DialogTitle>
          <DialogDescription>
            {t("statusUpdate.description", { orderId: order.orderId })}
            {showDiscountSection && (
              <span className="block mt-2 text-sm text-muted-foreground">
                Apply any discounts before confirming this order.
              </span>
            )}
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

          {/* Discount Section - Only show when confirming */}
          {showDiscountSection && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  <Label className="text-base font-medium">Apply Discounts (Optional)</Label>
                </div>
                
                {/* Order Summary */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Original Total</p>
                      <p className="font-medium">{formatPrice(getOriginalTotal(), order.warehouseCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Discount</p>
                      <p className="font-medium text-destructive">-{formatPrice(getTotalDiscount(), order.warehouseCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Final Total</p>
                      <p className="font-bold text-primary">{formatPrice(getFinalTotal(), order.warehouseCurrency)}</p>
                    </div>
                  </div>
                </div>

                {/* Products with discount options */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {order.products.map((product: any) => {
                    const discount = discounts[product.productId] || {};
                    const hasDiscount = discount.newPrice && discount.newPrice < product.unitPrice;
                    
                    return (
                      <div key={product.productId} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{product.productName}</h4>
                            <p className="text-xs text-muted-foreground">
                              {product.productCode} • Qty: {product.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Original</p>
                            <p className="font-medium text-sm">{formatPrice(product.unitPrice, order.warehouseCurrency)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`price-${product.productId}`} className="text-xs">New Price</Label>
                            <div className="relative">
                              <Input
                                id={`price-${product.productId}`}
                                type="number"
                                step="0.01"
                                min="0"
                                max={product.unitPrice - 0.01}
                                placeholder={product.unitPrice.toFixed(2)}
                                className="text-sm h-8"
                                value={discount.newPrice || ''}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  calculateDiscountAmount(product.productId, newPrice);
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor={`reason-${product.productId}`} className="text-xs">Reason</Label>
                            <Select
                              value={discount.reason || ''}
                              onValueChange={(value) => 
                                handleProductDiscountChange(product.productId, 'reason', value)
                              }
                            >
                              <SelectTrigger className="text-xs h-8">
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(DISCOUNT_REASON_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key} className="text-xs">
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`notes-${product.productId}`} className="text-xs">Notes</Label>
                            <Input
                              id={`notes-${product.productId}`}
                              placeholder="Optional notes..."
                              className="text-xs h-8"
                              value={discount.notes || ''}
                              onChange={(e) => 
                                handleProductDiscountChange(product.productId, 'notes', e.target.value)
                              }
                            />
                          </div>
                        </div>

                        {hasDiscount && (
                          <div className="bg-primary/5 p-2 rounded text-xs">
                            <div className="flex justify-between">
                              <span>Discount:</span>
                              <Badge variant="secondary" className="text-xs">
                                -{formatPrice(discount.discountAmount || 0, order.warehouseCurrency)} 
                                ({(((discount.discountAmount || 0) / product.unitPrice) * 100).toFixed(1)}%)
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Discount Summary */}
                {getTotalDiscount() > 0 && (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-3 w-3" />
                      <h4 className="font-medium text-sm">Discount Summary</h4>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Total Savings:</span>
                        <span className="font-medium text-green-600">{formatPrice(getTotalDiscount(), order.warehouseCurrency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Percentage Off:</span>
                        <span className="font-medium">
                          {((getTotalDiscount() / getOriginalTotal()) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

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
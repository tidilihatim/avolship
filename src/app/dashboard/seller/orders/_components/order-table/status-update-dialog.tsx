"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Percent, Calculator, AlertCircle } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatus } from "@/lib/db/models/order";
import { updateOrderStatus } from "@/app/actions/order";
import { DiscountApplication, DiscountReason, DISCOUNT_REASON_LABELS } from "@/types/discount";
import { formatPrice } from "@/lib/utils";
import { getDiscountLimitsForWarehouse } from "@/app/actions/seller-settings";

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
  const [isPending, startTransition] = useTransition();
  const [discounts, setDiscounts] = useState<Record<string, DiscountApplication>>({});
  const [discountLimits, setDiscountLimits] = useState<{
    hasLimits: boolean;
    maxDiscountPercentage: number;
    maxDiscountAmount?: number;
    isEnabled: boolean;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check if we should show discount section
  const showDiscountSection = selectedStatus === OrderStatus.CONFIRMED;
  
  // Clear validation errors when not showing discount section
  React.useEffect(() => {
    if (!showDiscountSection) {
      setValidationErrors({});
    }
  }, [showDiscountSection]);
  
  // Load discount limits when dialog opens
  React.useEffect(() => {
    if (isOpen && showDiscountSection) {
      getDiscountLimitsForWarehouse(order.sellerId, order.warehouseId)
        .then(result => {
          if (result.success) {
            setDiscountLimits(result.data);
          }
        })
        .catch(error => {
          console.error('Error loading discount limits:', error);
        });
    }
  }, [isOpen, showDiscountSection, order.sellerId, order.warehouseId]);

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
    
    // Clear any existing validation error for this product
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[productId];
      return newErrors;
    });
    
    // Validate discount limits if they exist
    if (discountLimits?.hasLimits && discountLimits.isEnabled && discountAmount > 0) {
      const maxDiscountPercentage = discountLimits.maxDiscountPercentage;
      const maxDiscountFromPercentage = (originalPrice * maxDiscountPercentage) / 100;
      const maxNewPriceFromPercentage = originalPrice - maxDiscountFromPercentage;
      
      // Check percentage limit
      if (discountAmount > maxDiscountFromPercentage) {
        setValidationErrors(prev => ({
          ...prev,
          [productId]: `Maximum new price can be ${formatPrice(maxNewPriceFromPercentage, order.warehouseCurrency)} (${maxDiscountPercentage}% max discount)`
        }));
      }
      
      // Check amount limit if specified
      if (discountLimits.maxDiscountAmount && discountAmount > discountLimits.maxDiscountAmount) {
        const maxNewPriceFromAmount = originalPrice - discountLimits.maxDiscountAmount;
        setValidationErrors(prev => ({
          ...prev,
          [productId]: `Maximum new price can be ${formatPrice(maxNewPriceFromAmount, order.warehouseCurrency)} (max discount: ${formatPrice(discountLimits.maxDiscountAmount as number, order.warehouseCurrency)})`
        }));
      }
    }
    
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

  const hasValidationErrors = () => {
    return Object.keys(validationErrors).length > 0;
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
    setValidationErrors({});
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
      <DialogContent className={`${showDiscountSection ? 'sm:max-w-6xl max-h-[90vh] overflow-y-auto' : 'sm:max-w-[500px]'}`}>
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">{t("statusUpdate.title")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("statusUpdate.description", { orderId: order.orderId })}
            {showDiscountSection && (
              <span className="block mt-2 text-muted-foreground">
                Apply any discounts before confirming this order.
              </span>
            )}
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
              <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value as OrderStatus); setDiscounts({}); setValidationErrors({}); setComment("");}}>
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

          {/* Discount Section - Only show when confirming */}
          {showDiscountSection && (
            <>
              <Separator className="my-6" />
              
              <div className="space-y-6">
                {/* Discount Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Percent className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Apply Discounts</h3>
                      <p className="text-sm text-muted-foreground">Optional discounts for this order</p>
                    </div>
                  </div>
                  {discountLimits?.hasLimits && discountLimits.isEnabled && (
                    <Badge variant="secondary" className="text-sm">
                      Max: {discountLimits.maxDiscountPercentage}%
                      {discountLimits.maxDiscountAmount && (
                        <span> or {formatPrice(discountLimits.maxDiscountAmount, order.warehouseCurrency)}</span>
                      )}
                    </Badge>
                  )}
                </div>
                
                {/* Discount Limits Alert */}
                {discountLimits?.hasLimits && !discountLimits.isEnabled && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <div>
                        <h4 className="font-medium text-warning">Discount Limits Disabled</h4>
                        <p className="text-sm text-warning/80">
                          The seller has disabled discount limits. You can apply unlimited discounts.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Order Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Original Total</p>
                        <p className="text-lg font-semibold">{formatPrice(getOriginalTotal(), order.warehouseCurrency)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Discount</p>
                        <p className="text-lg font-semibold text-destructive">-{formatPrice(getTotalDiscount(), order.warehouseCurrency)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Final Total</p>
                        <p className="text-lg font-bold text-primary">{formatPrice(getFinalTotal(), order.warehouseCurrency)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Products with discount options */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {order.products.map((product: any) => {
                    const discount = discounts[product.productId] || {};
                    const hasDiscount = discount.newPrice && discount.newPrice < product.unitPrice;
                    const hasError = validationErrors[product.productId];
                    
                    return (
                      <Card key={product.productId} className={`${hasError ? 'border-destructive' : ''}`}>
                        <CardContent className="p-4">
                          {/* Product Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-medium">{product.productName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {product.productCode} • Quantity: {product.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Original Price</p>
                              <p className="font-semibold">{formatPrice(product.unitPrice, order.warehouseCurrency)}</p>
                            </div>
                          </div>

                          {/* Discount Form */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`price-${product.productId}`} className="text-sm font-medium">New Price</Label>
                              <div className="space-y-2">
                                <Input
                                  id={`price-${product.productId}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder={product.unitPrice.toFixed(2)}
                                  className={`${hasError ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                                  value={discount.newPrice || ''}
                                  onChange={(e) => {
                                    const newPrice = parseFloat(e.target.value) || 0;
                                    calculateDiscountAmount(product.productId, newPrice);
                                  }}
                                />
                                {hasError && (
                                  <p className="text-sm text-destructive">{hasError}</p>
                                )}
                                {!hasError && discountLimits?.hasLimits && discountLimits.isEnabled && (
                                  <p className="text-xs text-muted-foreground">
                                    Max: {discountLimits.maxDiscountPercentage}%
                                    {discountLimits.maxDiscountAmount && (
                                      <span> or {formatPrice(discountLimits.maxDiscountAmount, order.warehouseCurrency)}</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`reason-${product.productId}`} className="text-sm font-medium">Reason</Label>
                              <Select
                                value={discount.reason || ''}
                                onValueChange={(value) => 
                                  handleProductDiscountChange(product.productId, 'reason', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(DISCOUNT_REASON_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`notes-${product.productId}`} className="text-sm font-medium">Notes</Label>
                              <Input
                                id={`notes-${product.productId}`}
                                placeholder="Optional notes..."
                                value={discount.notes || ''}
                                onChange={(e) => 
                                  handleProductDiscountChange(product.productId, 'notes', e.target.value)
                                }
                              />
                            </div>
                          </div>

                          {/* Discount Display */}
                          {hasDiscount && (
                            <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Applied Discount:</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    -{formatPrice(discount.discountAmount || 0, order.warehouseCurrency)}
                                  </Badge>
                                  <Badge variant="outline">
                                    {(((discount.discountAmount || 0) / product.unitPrice) * 100).toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Discount Summary */}
                {getTotalDiscount() > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Discount Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Savings:</span>
                          <span className="font-medium text-green-600">{formatPrice(getTotalDiscount(), order.warehouseCurrency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Percentage Off:</span>
                          <span className="font-medium">
                            {((getTotalDiscount() / getOriginalTotal()) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
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
            disabled={isPending || hasValidationErrors()}
          >
            {isPending ? t("statusUpdate.updating") : t("statusUpdate.updateStatus")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
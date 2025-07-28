"use client";

import React, { useState, useTransition } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiscountApplication, DiscountReason, DISCOUNT_REASON_LABELS } from "@/types/discount";
import { formatPrice } from "@/lib/utils";
import { getDiscountLimitsForWarehouse } from "@/app/actions/seller-settings";
import { applyDiscountToOrder } from "@/app/actions/order";

interface DiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderId: string;
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
  onDiscountApplied?: () => void;
}

export default function DiscountDialog({
  isOpen,
  onClose,
  order,
  onDiscountApplied,
}: DiscountDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [discounts, setDiscounts] = useState<Record<string, DiscountApplication>>({});
  const [discountLimits, setDiscountLimits] = useState<{
    hasLimits: boolean;
    maxDiscountPercentage: number;
    maxDiscountAmount?: number;
    isEnabled: boolean;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load discount limits when dialog opens
  React.useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, order.sellerId, order.warehouseId]);

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
    if (getTotalDiscount() === 0) {
      toast.error("Please apply at least one discount before submitting");
      return;
    }

    startTransition(async () => {
      try {
        const validDiscounts = Object.values(discounts).filter(d => 
          d.newPrice && d.newPrice < d.originalPrice && d.reason
        );
        
        if (validDiscounts.length === 0) {
          toast.error("Please provide valid discount information for all products");
          return;
        }

        const result = await applyDiscountToOrder({
          orderId: order._id,
          discounts: validDiscounts
        });
        
        if (result.success) {
          toast.success("Discounts applied successfully");
          onDiscountApplied?.();
          onClose();
          // Reset form
          setDiscounts({});
          setValidationErrors({});
        } else {
          toast.error(result.message || "Failed to apply discounts");
        }
      } catch (error) {
        toast.error("Failed to apply discounts");
      }
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setDiscounts({});
    setValidationErrors({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Apply Discounts
          </DialogTitle>
          <DialogDescription className="text-base">
            Apply discounts to order #{order.orderId}. These discounts will be applied immediately to the order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-6">
            {/* Discount Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Order Discounts</h3>
                  <p className="text-sm text-muted-foreground">Set discounted prices for products in this order</p>
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
        </div>

        <DialogFooter className="pt-6">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || hasValidationErrors() || getTotalDiscount() === 0}
          >
            {isPending ? "Applying Discounts..." : "Apply Discounts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Percent, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

interface DiscountSummaryCardProps {
  order: any;
  formatPrice: (price: number, warehouseId?: string) => string;
}

export default function DiscountSummaryCard({
  order,
  formatPrice,
}: DiscountSummaryCardProps) {
  const t = useTranslations();

  // Check if order has discounts
  const hasDiscounts = order.priceAdjustments && order.priceAdjustments.length > 0;
  const totalDiscountAmount = order.totalDiscountAmount || 0;
  const finalTotalPrice = order.finalTotalPrice || order.totalPrice;
  const originalTotalPrice = hasDiscounts ? order.totalPrice + totalDiscountAmount : order.totalPrice;

  // Calculate discount percentage for display
  const discountPercentage = hasDiscounts && originalTotalPrice > 0 
    ? ((totalDiscountAmount / originalTotalPrice) * 100) 
    : 0;

  if (!hasDiscounts) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          {t("orders.discounts.title", { default: "Discount Summary" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discount Overview */}
        <div className="bg-muted/50 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {t("orders.discounts.totalSavings", { default: "Total Savings" })}
            </span>
            <Badge variant="outline">
              -{discountPercentage.toFixed(1)}%
            </Badge>
          </div>
          <div className="text-2xl font-bold">
            -{formatPrice(totalDiscountAmount, order.warehouseId)}
          </div>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t("orders.discounts.originalTotal", { default: "Original Total" })}
            </span>
            <span className="line-through text-muted-foreground">
              {formatPrice(originalTotalPrice, order.warehouseId)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t("orders.discounts.discountAmount", { default: "Discount Amount" })}
            </span>
            <span className="font-medium">
              -{formatPrice(totalDiscountAmount, order.warehouseId)}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-medium">
              {t("orders.discounts.finalTotal", { default: "Final Total" })}
            </span>
            <span className="text-xl font-bold">
              {formatPrice(finalTotalPrice, order.warehouseId)}
            </span>
          </div>
        </div>

        {/* Applied Discounts */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t("orders.discounts.appliedDiscounts", { default: "Applied Discounts" })}
          </h4>
          
          {order.priceAdjustments.map((adjustment: any, index: number) => {
            const product = order.products.find((p: any) => p.productId === adjustment.productId);
            return (
              <div key={index} className="bg-background rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {product?.productName || t("orders.misc.unknownProduct", { default: "Unknown Product" })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("orders.fields.productCode", { default: "Code" })}: {product?.productCode || "N/A"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      -{adjustment.discountPercentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted/30 border rounded-md p-2">
                  <div className="text-xs">
                    <span className="font-medium">
                      {t("orders.discounts.reason", { default: "Reason" })}:
                    </span> {adjustment.reason}
                  </div>
                  {adjustment.notes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">
                        {t("orders.discounts.notes", { default: "Notes" })}:
                      </span> {adjustment.notes}
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t("orders.discounts.originalPrice", { default: "Original" })}: 
                    <span className="line-through ml-1">
                      {formatPrice(adjustment.originalPrice, order.warehouseId)}
                    </span>
                  </span>
                  <span className="font-medium">
                    {t("orders.discounts.newPrice", { default: "New Price" })}: 
                    {formatPrice(adjustment.adjustedPrice, order.warehouseId)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Message */}
        <div className="text-center text-sm bg-muted/30 rounded-lg p-3 border">
          {t("orders.discounts.savingsMessage", {
            default: "You saved {percentage}% on this order",
            percentage: discountPercentage.toFixed(1)
          })}
        </div>
      </CardContent>
    </Card>
  );
}
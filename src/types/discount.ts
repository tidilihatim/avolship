// Types for discount tracking system

export interface DiscountApplication {
  productId: string;
  originalPrice: number;
  newPrice: number;
  discountAmount: number;
  reason: string;
  notes?: string;
}

export interface ApplyDiscountRequest {
  orderId: string;
  discounts: DiscountApplication[];
}

export interface DiscountResponse {
  success: boolean;
  message?: string;
  order?: any;
  totalOriginalPrice?: number;
  totalFinalPrice?: number;
  totalDiscountAmount?: number;
}

export enum DiscountReason {
  CUSTOMER_NEGOTIATION = 'customer_negotiation',
  PROMOTION = 'promotion',
  LOYALTY_DISCOUNT = 'loyalty_discount',
  BULK_DISCOUNT = 'bulk_discount',
  SEASONAL_DISCOUNT = 'seasonal_discount',
  CLEARANCE = 'clearance',
  PRICE_MATCH = 'price_match',
  GOODWILL = 'goodwill',
  OTHER = 'other'
}

export const DISCOUNT_REASON_LABELS = {
  [DiscountReason.CUSTOMER_NEGOTIATION]: 'Customer Negotiation',
  [DiscountReason.PROMOTION]: 'Promotional Discount',
  [DiscountReason.LOYALTY_DISCOUNT]: 'Loyalty Customer Discount',
  [DiscountReason.BULK_DISCOUNT]: 'Bulk Order Discount',
  [DiscountReason.SEASONAL_DISCOUNT]: 'Seasonal Discount',
  [DiscountReason.CLEARANCE]: 'Clearance Sale',
  [DiscountReason.PRICE_MATCH]: 'Price Match',
  [DiscountReason.GOODWILL]: 'Goodwill Gesture',
  [DiscountReason.OTHER]: 'Other Reason'
};

export interface DiscountSummary {
  originalTotal: number;
  finalTotal: number;
  totalDiscount: number;
  discountPercentage: number;
  appliedBy: string;
  appliedAt: Date;
}
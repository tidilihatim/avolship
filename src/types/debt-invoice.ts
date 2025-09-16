// Debt-based Invoice System Types

export interface CustomFee {
  id: string;
  name: string;
  amount: number;
}

export interface CurrencyConversion {
  enabled: boolean;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

export interface DebtInvoiceConfiguration {
  startDate: string;
  endDate: string;
  warehouseId: string;
  paymentMethod: string;

  // Custom fees system
  customFees: CustomFee[];

  // Currency conversion
  currencyConversion: CurrencyConversion;

  // Previous debt options
  includePreviousDebt: boolean;
  selectedPreviousDebts: string[]; // Array of invoice IDs

  // Manual expedition additions
  manualExpeditions: ManualExpedition[];

  // Manual order selections
  manualOrders: ManualOrder[];

  // Refund processing fee (fixed amount per refund or total)
  refundProcessingFee: number;

  // Legacy fee fields (keeping for backward compatibility)
  fees: {
    confirmationFee: number;
    serviceFee: number;
    warehouseFee: number;
    shippingFee: number;
    processingFee: number;
    expeditionFee: number;
  };

  notes: string;
  terms: string;
}

export interface ManualExpedition {
  expeditionId: string;
  feePerKg: number;
  totalCost: number;
}

export interface ManualOrder {
  orderId: string;
  include: boolean;
}

export interface ExpeditionProduct {
  productId: string;
  productName: string;
  quantity: number;
}

export interface RefundOrderData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  products: RefundProduct[];
  originalPrice: number;
  refundReason: string;
  refundDate: Date;
  refundProcessingFee: number; // Hidden from seller
}

export interface RefundProduct {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface DebtInvoicePreview {
  // Basic info
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerBusinessName?: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCountry: string;
  currency: string;
  periodStart: string;
  periodEnd: string;

  // Orders and sales
  totalOrders: number;
  totalSales: number;
  orderData: OrderSummary[];

  // Expeditions
  totalExpeditions: number;
  totalExpeditionCosts: number;
  expeditionData: ExpeditionSummary[];

  // Refunds
  totalRefunds: number;
  totalRefundAmount: number;
  totalHiddenRefundFees: number; // Not shown to seller
  refundData: RefundOrderData[];

  // Custom fees
  customFees: CustomFee[];
  totalCustomFees: number;

  // Previous debt
  previousDebt?: number;

  // Final calculations
  grossSales: number;
  totalDeductions: number; // Expeditions + hidden refund fees + custom fees
  netPayment: number; // Can be negative (debt)
  isDebt: boolean;

  // Currency conversion (if enabled)
  currencyConversion?: {
    enabled: boolean;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    convertedNetPayment: number;
    convertedTotalFees: number;
    convertedProfit: number;
  };
}

export interface OrderSummary {
  orderId: string;
  orderDate: Date;
  customerName: string;
  products: ProductSummary[];
  totalAmount: number;
  status: string;
}

export interface ProductSummary {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ExpeditionSummary {
  expeditionId: string;
  expeditionSKU: string;
  weight: number;
  transportMode: string;
  carrier: string;
  originCountry: string;
  totalCost: number;
  products: ExpeditionProduct[];
}

export const AFRICAN_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', country: 'United States' },
  { code: 'MAD', name: 'Moroccan Dirham', country: 'Morocco' },
  { code: 'NGN', name: 'Nigerian Naira', country: 'Nigeria' },
  { code: 'GHS', name: 'Ghanaian Cedi', country: 'Ghana' },
  { code: 'KES', name: 'Kenyan Shilling', country: 'Kenya' },
  { code: 'ZAR', name: 'South African Rand', country: 'South Africa' },
  { code: 'EGP', name: 'Egyptian Pound', country: 'Egypt' },
  { code: 'TND', name: 'Tunisian Dinar', country: 'Tunisia' },
  { code: 'DZD', name: 'Algerian Dinar', country: 'Algeria' },
  { code: 'XOF', name: 'West African CFA Franc', country: 'West Africa' },
  { code: 'XAF', name: 'Central African CFA Franc', country: 'Central Africa' },
  { code: 'ETB', name: 'Ethiopian Birr', country: 'Ethiopia' },
  { code: 'UGX', name: 'Ugandan Shilling', country: 'Uganda' },
  { code: 'TZS', name: 'Tanzanian Shilling', country: 'Tanzania' },
] as const;

export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'mobile_money',
  'check',
  'credit_card',
  'cryptocurrency',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type CurrencyCode = typeof AFRICAN_CURRENCIES[number]['code'];
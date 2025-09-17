'use client';

import React from 'react';
import { format } from 'date-fns';
import { Receipt, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DebtInvoiceConfiguration } from '@/types/debt-invoice';

interface Seller {
  _id: string;
  name: string;
  email: string;
  businessName?: string | null;
  phone?: string | null;
  country?: string | null;
}

interface Warehouse {
  _id: string;
  name: string;
  country: string;
  currency: string;
}

interface DebtInvoicePreview {
  // Basic info
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerBusinessName?: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCountry: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;

  // Counts
  totalOrders: number;
  totalExpeditions: number;
  totalProducts: number;
  totalQuantity: number;
  totalRefunds: number;

  // Financial calculations
  totalSales: number;
  totalExpeditionCosts: number;
  totalRefundAmount: number;
  totalCustomFees: number;
  totalHiddenFees: number;
  grossSales: number;
  totalFees: number;
  netPayment: number;
  isDebt: boolean;

  // Previous debt
  previousDebtAmount: number;

  // Data arrays
  orderData: Array<{
    orderId: string;
    orderDate: string | Date;
    customerName: string;
    customerPhone: string;
    products: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    totalAmount: number;
    originalAmount?: number;
    discountAmount?: number;
    finalAmount?: number;
    hasDiscount?: boolean;
    totalDiscountAmount?: number;
    priceAdjustments?: Array<{
      productId: string;
      originalPrice: number;
      adjustedPrice: number;
      discountAmount: number;
      discountPercentage: number;
      reason: string;
      appliedBy: string;
      appliedAt: Date;
      notes?: string;
      _id: string;
    }>;
    status: string;
    statusComment?: string;
  }>;

  refundData: Array<{
    orderId: string;
    refundDate: string | Date;
    customerName: string;
    customerPhone: string;
    products: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    originalAmount: number;
    refundReason: string;
    status: string;
    statusComment?: string;
  }>;

  selectedExpeditions: Array<{
    id: string;
    expeditionId: string;
    expeditionCode: string;
    weight: number;
    feePerKg: number;
    totalCost: number;
    originCountry: string;
    carrier: string;
    transportMode: string;
    products: Array<{
      productName: string;
      productCode: string;
      quantity: number;
    }>;
  }>;

  // Currency conversion (only for final 3 values)
  currencyConversion?: {
    enabled: boolean;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
  } | null;
}

interface DebtInvoicePreviewProps {
  seller?: Seller;
  warehouse?: Warehouse;
  preview: DebtInvoicePreview;
  configuration: DebtInvoiceConfiguration;
  hideSensitiveInfo?: boolean; // Hide debt status, processing fees, etc. for sellers
  showSalesSummaryForSeller?: boolean; // Show sales summary section for sellers
}

// AvolShip Logo Component
const AvolShipLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 5L5 12.5V27.5L20 35L35 27.5V12.5L20 5Z" fill="#1c2d51" />
    <path d="M20 5L35 12.5L20 20L5 12.5L20 5Z" fill="#f37922" />
    <path d="M20 20V35L35 27.5V12.5L20 20Z" fill="#1c2d51" opacity="0.8" />
    <path d="M20 20V35L5 27.5V12.5L20 20Z" fill="#1c2d51" opacity="0.6" />
  </svg>
);

export default function DebtInvoicePreview({
  seller,
  warehouse,
  preview,
  configuration,
  hideSensitiveInfo = false,
  showSalesSummaryForSeller = false,
}: DebtInvoicePreviewProps) {

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || preview.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const formatDateShort = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  // Convert final amounts if currency conversion is enabled
  const getDisplayAmount = (amount: number, isNetAmount: boolean = false) => {
    if (preview.currencyConversion?.enabled && isNetAmount) {
      const convertedAmount = amount * preview.currencyConversion.rate;
      return formatCurrency(convertedAmount, preview.currencyConversion.toCurrency);
    }
    return formatCurrency(amount);
  };

  return (
    <div className="max-w-4xl mx-auto bg-background border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <AvolShipLogo className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold">AVOLSHIP</h1>
              <p className="text-primary-foreground/80 text-sm">Logistics & Shipping Solutions</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">INVOICE</h2>
            <div className="text-sm text-primary-foreground/80 mt-1">
              Period: {formatDateShort(preview.periodStart)} - {formatDateShort(preview.periodEnd)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Seller & Warehouse Info */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-3 text-foreground">Seller Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {preview.sellerName}</p>
              <p><span className="font-medium">Email:</span> {preview.sellerEmail}</p>
              {preview.sellerBusinessName && (
                <p><span className="font-medium">Business:</span> {preview.sellerBusinessName}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-foreground">Warehouse Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Warehouse:</span> {preview.warehouseName}</p>
              <p><span className="font-medium">Country:</span> {preview.warehouseCountry}</p>
              <p><span className="font-medium">Currency:</span> {preview.currency}</p>
              <p><span className="font-medium">Payment Method:</span> {preview.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Detailed Orders Section */}
        {preview.orderData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-3 font-medium">Order ID</th>
                      <th className="text-left py-3 px-3 font-medium">Date</th>
                      <th className="text-left py-3 px-3 font-medium">Customer</th>
                      <th className="text-left py-3 px-3 font-medium">Product</th>
                      <th className="text-center py-3 px-3 font-medium">Qty</th>
                      <th className="text-right py-3 px-3 font-medium">Unit Price</th>
                      <th className="text-right py-3 px-3 font-medium">Discount</th>
                      <th className="text-right py-3 px-3 font-medium">Final Price</th>
                      <th className="text-right py-3 px-3 font-medium">Total</th>
                      <th className="text-left py-3 px-3 font-medium">Status/Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.orderData.map((order, orderIndex) => (
                      order.products.map((product, productIndex) => {
                        const adjustment = order.priceAdjustments?.find(adj => adj.productId === product.productId);
                        const hasDiscount = adjustment && adjustment.discountAmount > 0;
                        const isFirstProduct = productIndex === 0;

                        return (
                          <tr key={`${orderIndex}-${productIndex}`} className="border-b hover:bg-muted/30">
                            {/* Order Info - only show for first product */}
                            <td className="py-3 px-3 font-mono text-sm">
                              {isFirstProduct ? order.orderId : ''}
                            </td>
                            <td className="py-3 px-3 text-sm">
                              {isFirstProduct ? formatDateShort(order.orderDate) : ''}
                            </td>
                            <td className="py-3 px-3 text-sm">
                              {isFirstProduct ? (
                                <div>
                                  <div className="font-medium">{order.customerName}</div>
                                  <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                                </div>
                              ) : ''}
                            </td>

                            {/* Product Info */}
                            <td className="py-3 px-3">
                              <div className="font-medium">{product.productName}</div>
                              {hasDiscount && adjustment && (
                                <div className="text-xs text-green-600">
                                  Reason: {adjustment.reason}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">{product.quantity}</td>
                            <td className="py-3 px-3 text-right">
                              {hasDiscount && adjustment ? (
                                <div>
                                  <span className="line-through text-muted-foreground text-sm">
                                    {formatCurrency(adjustment.originalPrice)}
                                  </span>
                                  <div className="text-green-600 font-medium">
                                    {formatCurrency(adjustment.adjustedPrice)}
                                  </div>
                                </div>
                              ) : (
                                formatCurrency(product.unitPrice)
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {hasDiscount && adjustment ? (
                                <div className="text-green-600">
                                  -{formatCurrency(adjustment.discountAmount)}
                                  <div className="text-xs">({adjustment.discountPercentage}%)</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-medium">
                              {formatCurrency(hasDiscount && adjustment ? adjustment.adjustedPrice : product.unitPrice)}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold">
                              {formatCurrency(product.totalPrice)}
                            </td>

                            {/* Status/Comments - only show for first product */}
                            <td className="py-3 px-3 text-sm">
                              {isFirstProduct ? (
                                <div>
                                  <div className="capitalize font-medium">{order.status}</div>
                                  {order.statusComment && (
                                    <div className="text-xs text-orange-600 mt-1">
                                      {order.statusComment}
                                    </div>
                                  )}
                                  {(order.totalDiscountAmount || 0) > 0 && (
                                    <div className="text-xs text-green-600 mt-1">
                                      Total Discount: -{formatCurrency(order.totalDiscountAmount || 0)}
                                    </div>
                                  )}
                                </div>
                              ) : ''}
                            </td>
                          </tr>
                        );
                      })
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{preview.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{preview.totalExpeditions}</div>
              <div className="text-sm text-muted-foreground">Expeditions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{preview.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{preview.totalRefunds}</div>
              <div className="text-sm text-muted-foreground">Refunds</div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Summary (For Reference Only - Not Charged) */}
        {((!hideSensitiveInfo && preview.orderData.length > 0) || (showSalesSummaryForSeller && preview.orderData.length > 0)) && (
          <Card className="border-primary/20 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-primary">Sales Summary (Reference Only)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sales revenue belongs to seller - shown for transparency only
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Orders:</span> {preview.totalOrders}
                </div>
                <div>
                  <span className="font-medium">Total Revenue:</span> {formatCurrency(preview.totalSales)}
                </div>
                <div>
                  <span className="font-medium">Total Products:</span> {preview.totalProducts}
                </div>
                <div>
                  <span className="font-medium">Total Quantity:</span> {preview.totalQuantity}
                </div>
              </div>
              <div className={`mt-3 p-2 rounded text-center font-medium ${
                preview.netPayment >= 0
                  ? 'bg-green-500/10 text-green-700 border border-green-500/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}>
                {showSalesSummaryForSeller
                  ? `You are ${preview.netPayment >= 0 ? 'PROFITABLE' : 'in Debt'}`
                  : `Seller is ${preview.netPayment >= 0 ? 'PROFITABLE' : 'IN DEBT'}`}
                ({formatCurrency(preview.totalSales)} revenue vs {formatCurrency(preview.totalSales - preview.netPayment)} total fees)
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expeditions Table - Like ShipSen */}
        {preview.selectedExpeditions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expeditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">ID</th>
                      <th className="text-center py-3 px-4 font-medium">WEIGHT (KG)</th>
                      <th className="text-center py-3 px-4 font-medium">TRANSPORT MODE</th>
                      <th className="text-center py-3 px-4 font-medium">DETAILS</th>
                      <th className="text-center py-3 px-4 font-medium">CARRIER</th>
                      <th className="text-center py-3 px-4 font-medium">COUNTRY</th>
                      <th className="text-right py-3 px-2 font-medium">EXPEDITION FEES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.selectedExpeditions.map((expedition, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-mono text-sm">{expedition.expeditionCode || expedition.expeditionId}</td>
                        <td className="py-3 px-4 text-center">{expedition.weight}</td>
                        <td className="py-3 px-4 text-center">{expedition.transportMode}</td>
                        <td className="py-3 px-4 text-center">{expedition.products.length} Products</td>
                        <td className="py-3 px-4 text-center">{expedition.carrier}</td>
                        <td className="py-3 px-4 text-center">{expedition.originCountry}</td>
                        <td className="py-3 px-2 text-right font-medium">{formatCurrency(expedition.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Refund Details */}
        {preview.refundData.length > 0 && (
          <Card className="border-orange-500/20">
            <CardHeader className="bg-orange-500/5">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-5 w-5" />
                Refund Information (For Reference Only)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {(!hideSensitiveInfo || showSalesSummaryForSeller) && (
                <div className="text-sm text-muted-foreground mb-4">
                  <strong>Note:</strong> Refund amounts are shown for transparency. {showSalesSummaryForSeller ? 'Processing fees are charged to you.' : 'Only processing fees are charged to seller.'}
                </div>
              )}
              <div className="space-y-4">
                {preview.refundData.map((refund, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold font-mono text-sm">Order #{refund.orderId}</h4>
                        <p className="text-sm text-muted-foreground">
                          Customer: {refund.customerName} | Phone: {refund.customerPhone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Refund Date: {formatDateShort(refund.refundDate)} | Status: <span className="capitalize">{refund.status}</span>
                        </p>
                        {refund.statusComment && (
                          <p className="text-sm text-orange-600 mt-1">
                            <strong>Refund Reason:</strong> {refund.statusComment}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Original Amount</div>
                        <div className="font-semibold">{formatCurrency(refund.originalAmount)}</div>
                        {(!hideSensitiveInfo || showSalesSummaryForSeller) && (
                          <div className="text-sm text-destructive">
                            Processing Fee: {formatCurrency(configuration.refundProcessingFee)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Refunded Products */}
                    {refund.products && refund.products.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left py-2 px-3 font-medium">Product</th>
                              <th className="text-center py-2 px-3 font-medium">Qty</th>
                              <th className="text-right py-2 px-3 font-medium">Unit Price</th>
                              <th className="text-right py-2 px-3 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {refund.products.map((product, productIndex) => (
                              <tr key={productIndex} className="border-b">
                                <td className="py-2 px-3 font-medium">{product.productName}</td>
                                <td className="py-2 px-3 text-center">{product.quantity}</td>
                                <td className="py-2 px-3 text-right">{formatCurrency(product.unitPrice)}</td>
                                <td className="py-2 px-3 text-right font-semibold">{formatCurrency(product.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fees Summary - What Seller Owes Us */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Invoice Charges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.selectedExpeditions.length > 0 && (
              <div className="flex justify-between">
                <span>Expedition Fees:</span>
                <span className="font-semibold">{formatCurrency(preview.totalExpeditionCosts)}</span>
              </div>
            )}

            {/* Legacy Fees Breakdown */}
            {(preview.totalCustomFees > 0 ||
              preview.totalRefunds > 0 ||
              (configuration.fees && Object.values(configuration.fees).some(fee => fee > 0)) ||
              showSalesSummaryForSeller) && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Service Fees:</div>

                {/* Custom Fees */}
                {configuration.customFees.map((fee, index) => (
                  <div key={index} className="flex justify-between ml-4 text-sm">
                    <span>{fee.name}:</span>
                    <span className="font-medium">{formatCurrency(fee.amount)}</span>
                  </div>
                ))}

                {/* Legacy Fees */}
                {configuration.fees.confirmationFee > 0 && (
                  <div className="flex justify-between ml-4 text-sm">
                    <span>Confirmation Fee:</span>
                    <span className="font-medium">{formatCurrency(configuration.fees.confirmationFee)}</span>
                  </div>
                )}
                {configuration.fees.serviceFee > 0 && (
                  <div className="flex justify-between ml-4 text-sm">
                    <span>Service Fee:</span>
                    <span className="font-medium">{formatCurrency(configuration.fees.serviceFee)}</span>
                  </div>
                )}
                {configuration.fees.warehouseFee > 0 && (
                  <div className="flex justify-between ml-4 text-sm">
                    <span>Warehouse Fee:</span>
                    <span className="font-medium">{formatCurrency(configuration.fees.warehouseFee)}</span>
                  </div>
                )}
                {configuration.fees.shippingFee > 0 && (
                  <div className="flex justify-between ml-4 text-sm">
                    <span>Shipping Fee:</span>
                    <span className="font-medium">{formatCurrency(configuration.fees.shippingFee)}</span>
                  </div>
                )}
                {configuration.fees.processingFee > 0 && (
                  <div className="flex justify-between ml-4 text-sm">
                    <span>Processing Fee:</span>
                    <span className="font-medium">{formatCurrency(configuration.fees.processingFee)}</span>
                  </div>
                )}
                {configuration.fees.expeditionFee > 0 && (
                  <div className="flex justify-between ml-4 text-sm">
                    <span>Expedition Fee (Legacy):</span>
                    <span className="font-medium">{formatCurrency(configuration.fees.expeditionFee)}</span>
                  </div>
                )}

                {/* Refund Processing Fees */}
                {(!hideSensitiveInfo || showSalesSummaryForSeller) && preview.totalRefunds > 0 && configuration.refundProcessingFee > 0 && (
                  <div className="flex justify-between ml-4 text-sm">
                    <span>Refund Processing ({preview.totalRefunds}x):</span>
                    <span className="font-medium">{formatCurrency(configuration.refundProcessingFee * preview.totalRefunds)}</span>
                  </div>
                )}
              </div>
            )}

            {preview.totalRefundAmount > 0 && (
              <div className="flex justify-between">
                <span>Total Refund Amount:</span>
                <span className="font-semibold">{formatCurrency(preview.totalRefundAmount)}</span>
              </div>
            )}

            {preview.previousDebtAmount > 0 && (
              <div className="flex justify-between">
                <span>Previous Debt:</span>
                <span className="font-semibold">{formatCurrency(preview.previousDebtAmount)}</span>
              </div>
            )}

            <Separator />

            <div className={`flex justify-between text-xl font-bold ${preview.netPayment >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              <span>{preview.netPayment >= 0 ? 'Net Profit:' : 'Net Payment:'}</span>
              <div className="text-right">
                <div>{getDisplayAmount(preview.netPayment, true)}</div>
                {preview.currencyConversion?.enabled && (
                  <div className="text-sm font-normal text-muted-foreground">
                    {formatCurrency(preview.netPayment)} {preview.currency}
                  </div>
                )}
              </div>
            </div>

            {preview.currencyConversion?.enabled && (
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <strong>Currency Conversion:</strong> {preview.currencyConversion.fromCurrency} to {preview.currencyConversion.toCurrency} at rate {preview.currencyConversion.rate}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          <p>This invoice was generated automatically by AvolShip system on {formatDate(new Date())}</p>
          <p className="mt-1">For questions, contact: support@avolship.com</p>
        </div>
      </div>
    </div>
  );
}
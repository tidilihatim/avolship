'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar, Percent, Tag } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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

interface InvoicePreview {
  totalOrders: number;
  totalExpeditions: number;
  totalProducts: number;
  totalQuantity: number;
  status?: string
  totalSales: number;
  totalOriginalSales: number;
  totalDiscountAmount: number;
  totalDiscountedOrders: number;
  discountPercentage: number;
  totalExpeditionValue: number;
  unpaidExpeditions: number;
  unpaidAmount: number;
  currency: string;
  warehouseName: string;
  sellerName: string;
  sellerEmail: string;
  sellerBusinessName?: string | null;
  warehouseCountry: string;
  periodStart: string;
  periodEnd: string;
  productData: Array<{
    productId: string;
    name: string;
    code: string;
    quantity: number;
    sales: number;
    originalSales: number;
    discountAmount: number;
    discountPercentage: number;
  }>;
  expeditionData?: Array<{
    expeditionId: string;
    expeditionCode: string;
    expeditionDate: string;
    totalValue: number;
    isPaid: boolean;
    status: string;
  }>;
  orderData?: Array<{
    orderId: string;
    orderDate: string | Date;
    customerName: string;
    originalTotal: number;
    finalTotal: number;
    discountAmount: number;
    discountPercentage: number;
    hasDiscount: boolean;
    priceAdjustments: any[];
    productCount: number;
    totalQuantity: number;
  }>;
}

interface InvoiceConfiguration {
  startDate: string;
  endDate: string;
  warehouseId: string;
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

interface ProfessionalInvoicePreviewProps {
  seller: Seller;
  warehouse?: Warehouse;
  preview: InvoicePreview;
  configuration: InvoiceConfiguration;
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

export default function ProfessionalInvoicePreview({
  seller,
  warehouse,
  preview,
  configuration,
}: ProfessionalInvoicePreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: preview.currency,
    }).format(amount);
  };

  const calculateTotalFees = () => {
    return Object.values(configuration.fees).reduce((sum, fee) => sum + fee, 0);
  };

  const calculateSubtotal = () => {
    return preview.totalSales;
  };

  const calculateNetAmount = () => {
    return calculateSubtotal() + calculateTotalFees();
  };

  // Calculate product-only totals (excluding expeditions)
  const calculateProductTotals = () => {
    const productTotalOriginal = preview.productData.reduce((sum, product) => sum + product.originalSales, 0);
    const productTotalFinal = preview.productData.reduce((sum, product) => sum + product.sales, 0);
    const productTotalDiscount = preview.productData.reduce((sum, product) => sum + product.discountAmount, 0);
    
    return {
      originalSales: productTotalOriginal,
      finalSales: productTotalFinal,
      discountAmount: productTotalDiscount
    };
  };

  // Generate mock invoice number for preview
  const mockInvoiceNumber = `INV-${format(new Date(), 'yyyyMM')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
      {/* Invoice Content */}
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            {/* Company Logo and Name */}
            <div className="flex items-center gap-4">
              <AvolShipLogo className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">AVOLSHIP</h1>
                <p className="text-sm text-muted-foreground">Logistics & E-commerce Platform</p>
              </div>
            </div>
            
            {/* Company Details */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Avolship Inc.</p>
              <p>123 Business Avenue</p>
              <p>Suite 400, Business District</p>
              <p>New York, NY 10001</p>
              <p>United States</p>
              <div className="pt-2 space-y-1">
                <p>Email: contact@avolship.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Website: www.avolship.com</p>
              </div>
            </div>
          </div>

          <div className="text-right space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">INVOICE</h2>
              <p className="text-lg font-medium text-muted-foreground">#{mockInvoiceNumber}</p>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-end gap-2">
                <span className="text-muted-foreground">Invoice Date:</span>
                <span className="font-medium text-foreground">{format(new Date(), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium text-foreground">{format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="secondary" className="text-xs">{preview?.status || "Draft"}</Badge>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Billing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bill To */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 pb-1 border-b border-border">
              Bill To
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground text-base">
                {seller.businessName || seller.name}
              </p>
              {seller.businessName && seller.name && (
                <p className="text-muted-foreground">Contact: {seller.name}</p>
              )}
              <p className="text-muted-foreground">{seller.email}</p>
              {seller.phone && (
                <p className="text-muted-foreground">{seller.phone}</p>
              )}
              {seller.country && (
                <p className="text-muted-foreground">{seller.country}</p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 pb-1 border-b border-border">
              Invoice Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Service Period:</span>
              </div>
              <p className="font-medium text-foreground pl-6">
                {format(new Date(preview.periodStart), 'MMM dd, yyyy')} - {format(new Date(preview.periodEnd), 'MMM dd, yyyy')}
              </p>
              <div className="pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Warehouse:</span>
                  <span className="font-medium text-foreground">{preview.warehouseName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-medium text-foreground">{preview.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Service Summary */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 pb-1 border-b border-border">
            Service Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg border border-border">
              <div className="text-2xl font-bold text-foreground">{preview.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Orders Delivered</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg border border-border">
              <div className="text-2xl font-bold text-foreground">{preview.totalExpeditions}</div>
              <div className="text-sm text-muted-foreground">Expeditions</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg border border-border">
              <div className="text-2xl font-bold text-foreground">{preview.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Unique Products</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg border border-border">
              <div className="text-2xl font-bold text-foreground">{preview.totalQuantity}</div>
              <div className="text-sm text-muted-foreground">Total Quantity</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Invoice Line Items */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 pb-1 border-b border-border">
            Service Details
          </h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground">Description</th>
                  <th className="text-center p-4 font-semibold text-foreground">Quantity</th>
                  <th className="text-right p-4 font-semibold text-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Orders Row */}
                {preview.totalOrders > 0 && (
                  <tr className="border-b border-border">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">Order Processing & Commission</p>
                        <p className="text-sm text-muted-foreground">
                          Processing and commission for {preview.totalOrders} delivered orders
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {preview.totalProducts} unique products • {preview.totalQuantity} total items
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-center text-foreground">{preview.totalOrders}</td>
                    <td className="p-4 text-right font-medium text-foreground">
                      {formatCurrency(preview.totalSales - preview.totalExpeditionValue)}
                    </td>
                  </tr>
                )}
                
                {/* Expeditions Row */}
                {preview.totalExpeditions > 0 && (
                  <tr className="border-b border-border">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">Expedition Processing & Commission</p>
                        <p className="text-sm text-muted-foreground">
                          Processing and commission for {preview.totalExpeditions} delivered expeditions
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-center text-foreground">{preview.totalExpeditions}</td>
                    <td className="p-4 text-right font-medium text-foreground">
                      {formatCurrency(preview.totalExpeditionValue)}
                    </td>
                  </tr>
                )}
                
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Details Table */}
        {preview.productData && preview.productData.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 pb-1 border-b border-border">
                Product Breakdown
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '120px'}}>Product Code</th>
                      <th className="text-left p-3 font-semibold text-foreground" style={{minWidth: '200px'}}>Product Name</th>
                      <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '80px'}}>Qty</th>
                      <th className="text-right p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '100px'}}>Original</th>
                      <th className="text-right p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '100px'}}>Discount</th>
                      <th className="text-right p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '120px'}}>Final Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.productData.map((product, index) => (
                      <tr key={product.productId} className="border-b border-border">
                        <td className="p-3 font-mono text-sm text-foreground whitespace-nowrap">{product.code}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-foreground text-sm">{product.name}</span>
                            {product.discountAmount > 0 && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 flex-shrink-0">
                                <Percent className="h-3 w-3 mr-1" />
                                {product.discountPercentage.toFixed(1)}% off
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center text-foreground text-sm whitespace-nowrap">{product.quantity}</td>
                        <td className="p-3 text-right text-foreground text-sm whitespace-nowrap">
                          {product.discountAmount > 0 ? (
                            <span className="line-through text-muted-foreground">
                              {formatCurrency(product.originalSales)}
                            </span>
                          ) : (
                            <span>{formatCurrency(product.originalSales)}</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-foreground text-sm whitespace-nowrap">
                          {product.discountAmount > 0 ? (
                            <span className="text-green-700 font-medium">
                              -{formatCurrency(product.discountAmount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium text-foreground text-sm whitespace-nowrap">
                          {formatCurrency(product.sales)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50 border-b border-border">
                      <td className="p-3 font-semibold text-foreground" colSpan={2}>Total</td>
                      <td className="p-3 text-center font-semibold text-foreground whitespace-nowrap">{preview.totalQuantity}</td>
                      <td className="p-3 text-right font-semibold text-foreground whitespace-nowrap">
                        {calculateProductTotals().discountAmount > 0 ? (
                          <span className="line-through text-muted-foreground">
                            {formatCurrency(calculateProductTotals().originalSales)}
                          </span>
                        ) : (
                          formatCurrency(calculateProductTotals().originalSales)
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold text-foreground whitespace-nowrap">
                        {calculateProductTotals().discountAmount > 0 ? (
                          <span className="text-green-700">
                            -{formatCurrency(calculateProductTotals().discountAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold text-foreground whitespace-nowrap">{formatCurrency(calculateProductTotals().finalSales)}</td>
                    </tr>
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Order Details Table */}
        {preview.orderData && preview.orderData.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 pb-1 border-b border-border">
                Order Breakdown
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '120px'}}>Order ID</th>
                        <th className="text-left p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '150px'}}>Customer</th>
                        <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '80px'}}>Products</th>
                        <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '80px'}}>Qty</th>
                        <th className="text-right p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '100px'}}>Original</th>
                        <th className="text-right p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '100px'}}>Discount</th>
                        <th className="text-right p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '120px'}}>Final Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.orderData.map((order, index) => (
                        <tr key={order.orderId} className="border-b border-border">
                          <td className="p-3 font-mono text-sm text-foreground whitespace-nowrap">{order.orderId}</td>
                          <td className="p-3 text-foreground text-sm">{order.customerName}</td>
                          <td className="p-3 text-center text-foreground text-sm whitespace-nowrap">{order.productCount}</td>
                          <td className="p-3 text-center text-foreground text-sm whitespace-nowrap">{order.totalQuantity}</td>
                          <td className="p-3 text-right text-foreground text-sm whitespace-nowrap">
                            {order.hasDiscount ? (
                              <span className="line-through text-muted-foreground">
                                {formatCurrency(order.originalTotal)}
                              </span>
                            ) : (
                              <span>{formatCurrency(order.originalTotal)}</span>
                            )}
                          </td>
                          <td className="p-3 text-right text-foreground text-sm whitespace-nowrap">
                            {order.hasDiscount ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-green-700 font-medium">
                                  -{formatCurrency(order.discountAmount)}
                                </span>
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  {order.discountPercentage.toFixed(1)}%
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium text-foreground text-sm whitespace-nowrap">
                            {formatCurrency(order.finalTotal)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 border-b border-border">
                        <td className="p-3 font-semibold text-foreground" colSpan={2}>Total Orders</td>
                        <td className="p-3 text-center font-semibold text-foreground whitespace-nowrap">{preview.orderData.reduce((sum, order) => sum + order.productCount, 0)}</td>
                        <td className="p-3 text-center font-semibold text-foreground whitespace-nowrap">{preview.orderData.reduce((sum, order) => sum + order.totalQuantity, 0)}</td>
                        <td className="p-3 text-right font-semibold text-foreground whitespace-nowrap">
                          {preview.totalDiscountAmount > 0 ? (
                            <span className="line-through text-muted-foreground">
                              {formatCurrency(preview.orderData.reduce((sum, order) => sum + order.originalTotal, 0))}
                            </span>
                          ) : (
                            formatCurrency(preview.orderData.reduce((sum, order) => sum + order.originalTotal, 0))
                          )}
                        </td>
                        <td className="p-3 text-right font-semibold text-foreground whitespace-nowrap">
                          {preview.totalDiscountAmount > 0 ? (
                            <span className="text-green-700">
                              -{formatCurrency(preview.orderData.reduce((sum, order) => sum + order.discountAmount, 0))}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(preview.orderData.reduce((sum, order) => sum + order.finalTotal, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Expedition Details Table */}
        {preview.expeditionData && preview.expeditionData.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 pb-1 border-b border-border">
                Expedition Breakdown
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '120px'}}>Expedition Code</th>
                        <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '100px'}}>Date</th>
                        <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '80px'}}>Status</th>
                        <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '80px'}}>Payment</th>
                        <th className="text-right p-3 font-semibold text-foreground whitespace-nowrap" style={{minWidth: '100px'}}>Value</th>
                      </tr>
                    </thead>
                  <tbody>
                    {preview.expeditionData.map((expedition, index) => (
                      <tr key={expedition.expeditionId} className="border-b border-border">
                        <td className="p-3 font-mono text-sm text-foreground whitespace-nowrap">{expedition.expeditionCode}</td>
                        <td className="p-3 text-center text-foreground text-sm whitespace-nowrap">
                          {format(new Date(expedition.expeditionDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant={expedition.status.toLowerCase() === 'delivered' ? 'default' : 'secondary'}
                            className="text-xs whitespace-nowrap"
                          >
                            {expedition.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant={expedition.isPaid ? 'default' : 'destructive'}
                            className="text-xs whitespace-nowrap"
                          >
                            {expedition.isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-medium text-foreground text-sm whitespace-nowrap">
                          {formatCurrency(expedition.totalValue)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50 border-b border-border">
                      <td className="p-3 font-semibold text-foreground" colSpan={4}>Total Expeditions</td>
                      <td className="p-3 text-right font-semibold text-foreground whitespace-nowrap">
                        {formatCurrency(preview.expeditionData.reduce((sum, exp) => sum + exp.totalValue, 0))}
                      </td>
                    </tr>
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Service Fees */}
        {calculateTotalFees() > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 pb-1 border-b border-border">
                Service Fees & Charges
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left p-4 font-semibold text-foreground">Fee Description</th>
                      <th className="text-right p-4 font-semibold text-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configuration.fees.confirmationFee > 0 && (
                      <tr className="border-b border-border">
                        <td className="p-4 text-foreground">Order Confirmation Processing Fee</td>
                        <td className="p-4 text-right text-foreground">{formatCurrency(configuration.fees.confirmationFee)}</td>
                      </tr>
                    )}
                    {configuration.fees.serviceFee > 0 && (
                      <tr className="border-b border-border">
                        <td className="p-4 text-foreground">Platform Service Fee</td>
                        <td className="p-4 text-right text-foreground">{formatCurrency(configuration.fees.serviceFee)}</td>
                      </tr>
                    )}
                    {configuration.fees.warehouseFee > 0 && (
                      <tr className="border-b border-border">
                        <td className="p-4 text-foreground">Warehouse Management Fee</td>
                        <td className="p-4 text-right text-foreground">{formatCurrency(configuration.fees.warehouseFee)}</td>
                      </tr>
                    )}
                    {configuration.fees.shippingFee > 0 && (
                      <tr className="border-b border-border">
                        <td className="p-4 text-foreground">Shipping & Handling Fee</td>
                        <td className="p-4 text-right text-foreground">{formatCurrency(configuration.fees.shippingFee)}</td>
                      </tr>
                    )}
                    {configuration.fees.processingFee > 0 && (
                      <tr className="border-b border-border">
                        <td className="p-4 text-foreground">Transaction Processing Fee</td>
                        <td className="p-4 text-right text-foreground">{formatCurrency(configuration.fees.processingFee)}</td>
                      </tr>
                    )}
                    {configuration.fees.expeditionFee > 0 && (
                      <tr className="border-b border-border">
                        <td className="p-4 text-foreground">Expedition Management Fee</td>
                        <td className="p-4 text-right text-foreground">{formatCurrency(configuration.fees.expeditionFee)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Invoice Total */}
        <div>
          <div className="flex justify-end">
            <div className="w-full max-w-md space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Gross Amount:</span>
                  <span className="font-medium text-foreground">{formatCurrency(calculateSubtotal())}</span>
                </div>
                
                {calculateTotalFees() > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Add: Service Fees</span>
                    <span className="font-medium text-foreground">+{formatCurrency(calculateTotalFees())}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center py-3 text-xl font-bold">
                <span className="text-foreground">Net Amount Payable:</span>
                <span className="text-foreground">{formatCurrency(calculateNetAmount())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="space-y-6">
          {configuration.notes && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Invoice Notes:</h4>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {configuration.notes}
                </p>
              </div>
            </div>
          )}
          
          {configuration.terms && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Terms & Conditions:</h4>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {configuration.terms}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            Thank you for your business!
          </p>
          <p className="text-xs text-muted-foreground">
            This invoice was generated on {format(new Date(), 'PPP')} by Avolship Platform
          </p>
          <p className="text-xs text-muted-foreground">
            For questions regarding this invoice, please contact invoicing@avolship.com
          </p>
        </div>
      </div>
    </div>
  );
}
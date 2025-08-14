'use client';

import React from 'react';
import { ArrowLeft, Printer, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { InvoiceStatus } from '@/types/invoice';
import ProfessionalInvoicePreview from '@/app/dashboard/admin/users/[id]/invoice/generate/_components/professional-invoice-preview';
import PrintInvoicePreview from '@/app/dashboard/admin/users/[id]/invoice/generate/_components/print-invoice-preview';


interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  createdAt: Date;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  summary: {
    totalOrders: number;
    totalExpeditions: number;
    totalProducts: number;
    totalQuantity: number;
    totalSales: number;
    totalFees: number;
    netAmount: number;
    totalTax: number;
    finalAmount: number;
    unpaidExpeditions: number;
    unpaidAmount: number;
  };
  fees: {
    confirmationFee: number;
    serviceFee: number;
    warehouseFee: number;
    shippingFee: number;
    processingFee: number;
    expeditionFee: number;
    totalFees: number;
  };
  sellerId: {
    _id: string;
    name: string;
    email: string;
    businessName?: string;
    phone?: string;
    country?: string;
  };
  warehouseId: {
    _id: string;
    name: string;
    country: string;
    currency: string;
    address?: string;
  };
  generatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  notes?: string;
  terms?: string;
  paidDate?: Date;
}

interface OrderData {
  _id: string;
  orderId: string;
  status: string;
  totalPrice: number;
  finalTotalPrice?: number;
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
  createdAt: Date;
  customer: {
    name: string;
  };
  products: Array<{
    productId: {
      _id: string;
      name: string;
      code: string;
    };
    quantity: number;
    unitPrice: number;
  }>;
}

interface ExpeditionData {
  _id: string;
  expeditionCode: string;
  totalValue: number;
  expeditionDate: Date;
  isPaid: boolean;
  status: string;
}

interface SellerInvoiceDetailPageProps {
  invoice: InvoiceData;
  orders: OrderData[];
  expeditions: ExpeditionData[];
}

export default function SellerInvoiceDetailPage({ invoice, orders, expeditions }: SellerInvoiceDetailPageProps) {
  // Handle print functionality
  const handlePrint = () => {
    const printContent = document.getElementById('print-invoice-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                @media print {
                  body { margin: 0; padding: 0; }
                  * { print-color-adjust: exact; }
                }
                ${printContent.innerHTML.includes('style') ? '' : `
                  body { font-family: Arial, sans-serif; margin: 0; padding: 15px; }
                  .print-invoice { margin: 0 !important; padding: 0 !important; }
                `}
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = {
      [InvoiceStatus.DRAFT]: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
      [InvoiceStatus.GENERATED]: { label: 'Generated', className: 'bg-primary/10 text-primary' },
      [InvoiceStatus.PAID]: { label: 'Paid', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      [InvoiceStatus.OVERDUE]: { label: 'Overdue', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
      [InvoiceStatus.CANCELLED]: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    };
    
    return statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  // Calculate product breakdown
  // Calculate product breakdown with discount information
  const productBreakdown: { [key: string]: { name: string; code: string; quantity: number; sales: number; originalSales: number; discountAmount: number; discountPercentage: number } } = {};
  
  orders.forEach(order => {
    const orderPriceAdjustments = order.priceAdjustments || [];
    
    order.products.forEach(product => {
      const productKey = product.productId._id;
      if (!productBreakdown[productKey]) {
        productBreakdown[productKey] = {
          name: product.productId.name,
          code: product.productId.code,
          quantity: 0,
          sales: 0,
          originalSales: 0,
          discountAmount: 0,
          discountPercentage: 0
        };
      }
      
      // Find if this product has any price adjustments
      const productAdjustment = orderPriceAdjustments.find(adj => adj.productId === productKey);
      
      if (productAdjustment) {
        // Product has discount
        const productOriginalTotal = productAdjustment.originalPrice * product.quantity;
        const productFinalTotal = product.unitPrice * product.quantity;
        const productDiscountAmount = productOriginalTotal - productFinalTotal;
        
        productBreakdown[productKey].quantity += product.quantity;
        productBreakdown[productKey].sales += productFinalTotal;
        productBreakdown[productKey].originalSales += productOriginalTotal;
        productBreakdown[productKey].discountAmount += productDiscountAmount;
      } else {
        // No discount
        const productTotal = product.unitPrice * product.quantity;
        productBreakdown[productKey].quantity += product.quantity;
        productBreakdown[productKey].sales += productTotal;
        productBreakdown[productKey].originalSales += productTotal;
      }
    });
  });

  const productData = Object.values(productBreakdown);

  // Transform data for ProfessionalInvoicePreview
  const seller = {
    _id: invoice.sellerId._id,
    name: invoice.sellerId.name,
    email: invoice.sellerId.email,
    businessName: invoice.sellerId.businessName,
    phone: invoice.sellerId.phone,
    country: invoice.sellerId.country,
  };

  const warehouse = {
    _id: invoice.warehouseId._id,
    name: invoice.warehouseId.name,
    country: invoice.warehouseId.country,
    currency: invoice.warehouseId.currency,
  };

  // Prepare expedition data
  const expeditionData = expeditions.map(expedition => ({
    expeditionId: expedition._id,
    expeditionCode: expedition.expeditionCode,
    expeditionDate: new Date(expedition.expeditionDate).toISOString(),
    totalValue: expedition.totalValue,
    isPaid: expedition.isPaid,
    status: expedition.status,
  }));

  // Calculate discount totals
  const totalOriginalSales = productData.reduce((sum, product) => sum + product.originalSales, 0);
  const totalDiscountAmount = productData.reduce((sum, product) => sum + product.discountAmount, 0);
  const totalDiscountedOrders = orders.filter(order => (order.totalDiscountAmount || 0) > 0).length;
  const discountPercentage = totalOriginalSales > 0 ? ((totalDiscountAmount / totalOriginalSales) * 100) : 0;

  // Prepare order data for order breakdown
  const orderData = orders.map(order => {
    const orderTotalDiscount = order.totalDiscountAmount || 0;
    const orderFinalTotal = order.finalTotalPrice || order.totalPrice;
    const orderOriginalTotal = orderTotalDiscount > 0 
      ? (orderFinalTotal + orderTotalDiscount) 
      : order.totalPrice;
    
    return {
      orderId: order.orderId,
      orderDate: order.createdAt,
      customerName: order.customer?.name || 'Unknown Customer',
      originalTotal: orderOriginalTotal,
      finalTotal: orderFinalTotal,
      discountAmount: orderTotalDiscount,
      discountPercentage: (orderTotalDiscount && orderOriginalTotal) 
        ? ((orderTotalDiscount / orderOriginalTotal) * 100) 
        : 0,
      hasDiscount: orderTotalDiscount > 0,
      priceAdjustments: order.priceAdjustments || [],
      productCount: order.products.length,
      totalQuantity: order.products.reduce((sum, product) => sum + product.quantity, 0)
    };
  });

  const preview = {
    totalOrders: invoice.summary.totalOrders,
    totalExpeditions: invoice.summary.totalExpeditions,
    totalProducts: invoice.summary.totalProducts,
    totalQuantity: invoice.summary.totalQuantity,
    totalSales: invoice.summary.totalSales,
    totalOriginalSales,
    totalDiscountAmount,
    totalDiscountedOrders,
    discountPercentage,
    status: invoice.status,
    unpaidExpeditions: invoice.summary.unpaidExpeditions,
    totalExpeditionValue: invoice.summary.unpaidAmount,
    unpaidAmount: invoice.summary.unpaidAmount,
    currency: invoice.currency,
    warehouseName: invoice.warehouseId.name,
    sellerName: invoice.sellerId.name,
    sellerEmail: invoice.sellerId.email,
    sellerBusinessName: invoice.sellerId.businessName,
    warehouseCountry: invoice.warehouseId.country,
    periodStart: new Date(invoice.periodStart).toISOString(),
    periodEnd: new Date(invoice.periodEnd).toISOString(),
    productData: productData.map(product => ({
      productId: product.name, // Using name as ID since we don't have the actual ID
      name: product.name,
      code: product.code,
      quantity: product.quantity,
      sales: product.sales,
      originalSales: product.originalSales,
      discountAmount: product.discountAmount,
      discountPercentage: product.discountPercentage,
    })),
    expeditionData: expeditionData,
    orderData: orderData,
  };

  const configuration = {
    startDate: new Date(invoice.periodStart).toISOString(),
    endDate: new Date(invoice.periodEnd).toISOString(),
    warehouseId: invoice.warehouseId._id,
    fees: {
      confirmationFee: invoice.fees.confirmationFee,
      serviceFee: invoice.fees.serviceFee,
      warehouseFee: invoice.fees.warehouseFee,
      shippingFee: invoice.fees.shippingFee,
      processingFee: invoice.fees.processingFee,
      expeditionFee: invoice.fees.expeditionFee,
    },
    notes: invoice.notes || '',
    terms: invoice.terms || '',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/seller/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Details</h1>
            <p className="text-muted-foreground">
              Invoice {invoice.invoiceNumber} • Generated {formatDate(invoice.generatedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Display (read-only) */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusBadge(invoice.status).className}>
              {getStatusBadge(invoice.status).label}
            </Badge>
          </div>

          {/* Action Buttons */}
          {/* <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div> */}
        </div>
      </div>

      {/* Professional Invoice Preview */}
      <ProfessionalInvoicePreview
        seller={seller}
        warehouse={warehouse}
        preview={preview}
        configuration={configuration}
      />

      {/* Associated Orders and Expeditions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Associated Orders */}
        <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Associated Orders ({orders.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Orders included in this invoice
            </p>
          </div>
          
          {orders.length > 0 ? (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <Link key={order._id} href={`/dashboard/seller/orders/${order._id}`} className="block p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                        {order.orderId}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {order.status}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: invoice.currency,
                      }).format(order.totalPrice)}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    Created: {formatDate(order.createdAt)}
                  </div>
                  
                  <div className="space-y-1">
                    {order.products.map((product, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {product.productId.name} ({product.productId.code})
                        </span>
                        <span className="font-medium">
                          {product.quantity}x @ {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: invoice.currency,
                          }).format(product.unitPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No orders associated with this invoice
            </div>
          )}
        </div>

        {/* Associated Expeditions */}
        <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Associated Expeditions ({expeditions.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Expeditions included in this invoice
            </p>
          </div>
          
          {expeditions.length > 0 ? (
            <div className="divide-y divide-border">
              {expeditions.map((expedition) => (
                <Link key={expedition._id} href={`/dashboard/seller/expeditions/${expedition._id}`} className="block p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                        {expedition.expeditionCode}
                      </code>
                      <Badge 
                        variant={expedition.status.toLowerCase() === 'delivered' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {expedition.status}
                      </Badge>
                      <Badge 
                        variant={expedition.isPaid ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {expedition.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: invoice.currency,
                      }).format(expedition.totalValue)}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Expedition Date: {formatDate(expedition.expeditionDate)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No expeditions associated with this invoice
            </div>
          )}
        </div>
      </div>

      {/* Hidden Print Component */}
      <div id="print-invoice-content" style={{ display: 'none' }}>
        <PrintInvoicePreview
          seller={seller}
          warehouse={warehouse}
          preview={preview}
          configuration={configuration}
          invoiceNumber={invoice.invoiceNumber}
        />
      </div>
    </div>
  );
}
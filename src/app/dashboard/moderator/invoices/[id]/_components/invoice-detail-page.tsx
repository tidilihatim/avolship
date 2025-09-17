'use client';

import React, { useState, useTransition } from 'react';
import { ArrowLeft, Printer, Edit, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { InvoiceStatus } from '@/types/invoice';
import { updateDebtInvoiceStatus } from '@/app/actions/debt-invoice';
import DebtInvoicePreview from '@/app/dashboard/admin/users/[id]/invoice/generate/_components/debt-invoice-preview';

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
    totalRefunds: number;
    totalSales: number;
    totalExpeditionCosts: number;
    totalRefundAmount: number;
    totalCustomFees: number;
    totalHiddenFees: number;
    previousDebtAmount: number;
    grossSales: number;
    totalDeductions: number;
    netPayment: number;
    isDebt: boolean;
  };
  fees: {
    confirmationFee: number;
    serviceFee: number;
    warehouseFee: number;
    shippingFee: number;
    processingFee: number;
    expeditionFee: number;
    customFees: Array<{
      id: string;
      name: string;
      amount: number;
    }>;
    refundProcessingFees: number;
  };
  manualExpeditions: Array<{
    expeditionId: string;
    feePerKg: number;
    totalCost: number;
  }>;
  currencyConversion?: {
    enabled: boolean;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
  };
  includedPreviousDebts: string[];
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
  refundReason?: string;
  statusComment?: string;
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
    phone?: string;
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
  totalValue?: number;
  expeditionDate: Date;
  isPaid?: boolean;
  status: string;
  weight?: number;
  transportMode?: string;
  fromCountry?: string;
  providerId?: {
    name: string;
  };
  providerName?: string;
  carrierInfo?: {
    name: string;
    phone?: string;
    email?: string;
    companyName?: string;
  };
  products?: Array<{
    productId?: {
      name: string;
    };
    productCode?: string;
    quantity: number;
  }>;
}

interface InvoiceDetailPageProps {
  invoice: InvoiceData;
  orders: OrderData[];
  expeditions: ExpeditionData[];
  refundOrders: OrderData[];
}

export default function InvoiceDetailPage({ invoice, orders, expeditions, refundOrders }: InvoiceDetailPageProps) {
  const t = useTranslations('invoices');
  const tDetail = useTranslations('invoices.detail');
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(invoice.status);

  // Handle status update
  const handleStatusUpdate = async () => {
    if (newStatus === invoice.status) {
      setIsEditingStatus(false);
      return;
    }

    startTransition(async () => {
      const result = await updateDebtInvoiceStatus(invoice._id, newStatus);
      
      if (result.success) {
        toast.success(t('messages.statusUpdatedSuccess'));
        setIsEditingStatus(false);
        router.refresh();
      } else {
        toast.error(result.message || t('messages.statusUpdateFailed'));
        setNewStatus(invoice.status); // Reset to original status
      }
    });
  };

  // Handle print functionality
  const handlePrint = () => {
    const printContent = document.getElementById('invoice-preview-container');
    if (!printContent) {
      alert('No invoice preview found.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups and try again.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 0.3in;
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.2;
              color: #000;
            }

            /* Readable headers */
            h1 { font-size: 16px; margin-bottom: 3px; }
            h2 { font-size: 14px; margin-bottom: 3px; }
            h3 { font-size: 12px; margin-bottom: 2px; }
            h4, h5, h6 { font-size: 11px; margin-bottom: 2px; }

            /* Logo size control */
            img {
              max-width: 80px !important;
              max-height: 40px !important;
              width: auto !important;
              height: auto !important;
            }

            /* Compact spacing */
            .space-y-1 > * + *, [class*="space-y-1"] > * + * { margin-top: 1px !important; }
            .space-y-2 > * + *, [class*="space-y-2"] > * + * { margin-top: 2px !important; }
            .space-y-3 > * + *, [class*="space-y-3"] > * + * { margin-top: 3px !important; }
            .space-y-4 > * + *, [class*="space-y-4"] > * + * { margin-top: 4px !important; }
            .space-y-6 > * + *, [class*="space-y-6"] > * + * { margin-top: 6px !important; }
            .space-y-8 > * + *, [class*="space-y-8"] > * + * { margin-top: 8px !important; }

            /* Balanced margins */
            .mb-1, [class*="mb-1"] { margin-bottom: 2px !important; }
            .mb-2, [class*="mb-2"] { margin-bottom: 3px !important; }
            .mb-3, [class*="mb-3"] { margin-bottom: 4px !important; }
            .mb-4, [class*="mb-4"] { margin-bottom: 6px !important; }
            .mb-6, [class*="mb-6"] { margin-bottom: 8px !important; }
            .mb-8, [class*="mb-8"] { margin-bottom: 10px !important; }

            /* Balanced padding */
            .p-1, [class*="p-1"] { padding: 2px !important; }
            .p-2, [class*="p-2"] { padding: 3px !important; }
            .p-3, [class*="p-3"] { padding: 4px !important; }
            .p-4, [class*="p-4"] { padding: 6px !important; }
            .p-6, [class*="p-6"] { padding: 8px !important; }
            .px-3, [class*="px-3"] { padding-left: 4px !important; padding-right: 4px !important; }
            .py-2, [class*="py-2"] { padding-top: 3px !important; padding-bottom: 3px !important; }
            .py-3, [class*="py-3"] { padding-top: 4px !important; padding-bottom: 4px !important; }

            /* Readable tables */
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 3px 0;
              font-size: 10px;
            }
            th, td {
              padding: 4px 6px !important;
              border-bottom: 1px solid #ddd;
              vertical-align: top;
              line-height: 1.2;
            }
            th {
              background: #f5f5f5;
              font-weight: 600;
              font-size: 10px;
            }

            /* Text sizes - print readable */
            .text-xs, [class*="text-xs"] { font-size: 9px !important; }
            .text-sm, [class*="text-sm"] { font-size: 10px !important; }
            .text-base { font-size: 11px !important; }
            .text-lg, [class*="text-lg"] { font-size: 12px !important; }
            .text-xl, [class*="text-xl"] { font-size: 13px !important; }
            .text-2xl, [class*="text-2xl"] { font-size: 14px !important; }
            .text-3xl, [class*="text-3xl"] { font-size: 16px !important; }

            /* Layout utilities */
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .font-mono { font-family: 'Courier New', monospace; font-size: 10px; }

            /* Grid and flex - compact */
            .grid { display: grid; gap: 2px; }
            .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }

            /* Card-like elements */
            .border, [class*="border"] {
              border: 1px solid #ddd !important;
              margin: 2px 0 !important;
            }
            .rounded-lg, [class*="rounded"] { border-radius: 3px; }
            .bg-muted, [class*="bg-muted"] { background: #f8f9fa; }

            /* Hide unnecessary elements for print */
            .no-print { display: none !important; }

            /* Badges - readable */
            .inline-flex, [class*="badge"], .badge {
              display: inline;
              padding: 2px 4px;
              font-size: 9px;
              border: 1px solid #ddd;
              border-radius: 2px;
              background: #f0f0f0;
            }

            /* Print specific */
            @media print {
              body {
                margin: 0;
                padding: 0;
                font-size: 10px;
              }

              /* Force page breaks */
              .page-break { page-break-before: always; }
              .avoid-break { page-break-inside: avoid; }

              /* Ensure single page */
              html, body { height: auto !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };


  // Get status badge styling
  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = {
      [InvoiceStatus.DRAFT]: { label: t('statusLabels.DRAFT'), className: 'bg-muted text-muted-foreground' },
      [InvoiceStatus.GENERATED]: { label: t('statusLabels.GENERATED'), className: 'bg-primary/10 text-primary' },
      [InvoiceStatus.PAID]: { label: t('statusLabels.PAID'), className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      [InvoiceStatus.OVERDUE]: { label: t('statusLabels.OVERDUE'), className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
      [InvoiceStatus.CANCELLED]: { label: t('statusLabels.CANCELLED'), className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    };
    
    return statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

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
  
  // Calculate discount percentage for each product
  Object.keys(productBreakdown).forEach(productKey => {
    const product = productBreakdown[productKey];
    if (product.originalSales > 0) {
      product.discountPercentage = ((product.discountAmount / product.originalSales) * 100);
    }
  });


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


  // Calculate total fees
  const totalFees = (
    invoice.fees.confirmationFee +
    invoice.fees.serviceFee +
    invoice.fees.warehouseFee +
    invoice.fees.shippingFee +
    invoice.fees.processingFee +
    invoice.fees.expeditionFee +
    (invoice.fees.customFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0) +
    (invoice.fees.refundProcessingFees || 0)
  );



  return (
    <div className="space-y-6">
      {/* Header with Status Management */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tDetail('backToInvoices')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tDetail('invoiceDetails')}</h1>
            <p className="text-muted-foreground">
              {tDetail('invoiceInfo', { number: invoice.invoiceNumber, date: formatDate(invoice.generatedAt) })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Management */}
          <div className="flex items-center gap-2">
            {isEditingStatus ? (
              <div className="flex items-center gap-2">
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as InvoiceStatus)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InvoiceStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusBadge(status).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleStatusUpdate}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setIsEditingStatus(false);
                  setNewStatus(invoice.status);
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadge(invoice.status).className}>
                  {getStatusBadge(invoice.status).label}
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingStatus(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {tDetail('print')}
            </Button>
          </div>
        </div>
      </div>

      {/* Debt Invoice Preview */}
      <div id="invoice-preview-container">
        <DebtInvoicePreview
          seller={seller}
          warehouse={warehouse}
        preview={{
          sellerId: invoice.sellerId._id,
          sellerName: invoice.sellerId.name,
          sellerEmail: invoice.sellerId.email,
          sellerBusinessName: invoice.sellerId.businessName,
          warehouseId: invoice.warehouseId._id,
          warehouseName: invoice.warehouseId.name,
          warehouseCountry: invoice.warehouseId.country,
          currency: invoice.currency,
          periodStart: new Date(invoice.periodStart).toISOString(),
          periodEnd: new Date(invoice.periodEnd).toISOString(),
          paymentMethod: 'bank_transfer',
          totalOrders: invoice.summary.totalOrders,
          totalExpeditions: invoice.summary.totalExpeditions,
          totalProducts: invoice.summary.totalProducts,
          totalQuantity: invoice.summary.totalQuantity,
          totalRefunds: invoice.summary.totalRefunds || 0,
          totalSales: invoice.summary.totalSales,
          totalExpeditionCosts: invoice.summary.totalExpeditionCosts,
          totalRefundAmount: invoice.summary.totalRefundAmount || 0,
          totalCustomFees: invoice.summary.totalCustomFees || 0,
          totalHiddenFees: invoice.summary.totalHiddenFees || 0,
          previousDebtAmount: invoice.summary.previousDebtAmount || 0,
          grossSales: invoice.summary.grossSales,
          totalFees: totalFees,
          netPayment: invoice.summary.netPayment,
          isDebt: invoice.summary.isDebt,
          currencyConversion: invoice.currencyConversion,
          orderData: orders.map(order => ({
            _id: order._id,
            orderId: order.orderId,
            orderDate: new Date(order.createdAt),
            customerName: order.customer?.name || 'Unknown Customer',
            customerPhone: order.customer?.phone || '',
            products: order.products.map(product => ({
              productId: product.productId?._id || '',
              productName: product.productId?.name || 'Unknown Product',
              productCode: product.productId?.code || '',
              quantity: product.quantity || 0,
              unitPrice: product.unitPrice || 0,
              totalPrice: (product.unitPrice || 0) * (product.quantity || 0),
            })),
            totalAmount: order.totalPrice || 0,
            originalAmount: order.totalPrice || 0,
            discountAmount: order.totalDiscountAmount || 0,
            finalAmount: order.finalTotalPrice || order.totalPrice || 0,
            hasDiscount: (order.totalDiscountAmount || 0) > 0,
            priceAdjustments: order.priceAdjustments || [],
            status: order.status,
          })),
          selectedExpeditions: expeditions.map(expedition => {
            // Find the manual expedition fee info for this expedition
            const manualExpedition = invoice.manualExpeditions?.find(
              me => me.expeditionId === expedition._id
            );

            return {
              id: expedition._id,
              expeditionId: expedition._id,
              expeditionCode: expedition.expeditionCode,
              weight: expedition.weight || 0,
              feePerKg: manualExpedition?.feePerKg || 0,
              totalCost: manualExpedition?.totalCost || 0,
              transportMode: expedition.transportMode || 'Unknown',
              originCountry: expedition.fromCountry || 'Unknown',
              carrier: expedition.carrierInfo?.name || expedition.providerName || expedition.providerId?.name || 'Unknown',
              expeditionDate: new Date(expedition.expeditionDate).toISOString(),
              products: expedition.products?.map(product => ({
                productName: product.productId?.name || 'Unknown Product',
                productCode: product.productCode || '',
                quantity: product.quantity || 0,
              })) || [],
              carrierInfo: {
                name: expedition.carrierInfo?.name || expedition.providerName || expedition.providerId?.name || 'Unknown'
              },
              status: expedition.status,
            };
          }),
          refundData: refundOrders.map(refund => {
            const totalPrice = refund.totalPrice || 0;
            const refundProcessingFee = invoice.fees?.refundProcessingFees || 0;

            return {
              orderId: refund._id,
              customerName: refund.customer?.name || 'Unknown Customer',
              customerPhone: refund.customer?.phone || '',
              products: refund.products.map(product => {
                const unitPrice = product.unitPrice || 0;
                const quantity = product.quantity || 0;
                return {
                  productId: product.productId?._id || '',
                  productName: product.productId?.name || 'Unknown Product',
                  quantity: quantity,
                  unitPrice: unitPrice,
                  totalPrice: unitPrice * quantity,
                };
              }),
              originalAmount: totalPrice,
              refundReason: refund.refundReason || refund.statusComment || 'No reason provided',
              refundDate: new Date(refund.createdAt),
              refundProcessingFee: refundProcessingFee,
              status: 'refunded',
              statusComment: refund.statusComment || refund.refundReason || 'No additional comments',
            };
          }),
        }}
        configuration={{
          startDate: new Date(invoice.periodStart).toISOString(),
          endDate: new Date(invoice.periodEnd).toISOString(),
          warehouseId: invoice.warehouseId._id,
          paymentMethod: 'bank_transfer',
          customFees: invoice.fees.customFees || [],
          currencyConversion: invoice.currencyConversion || {
            enabled: false,
            fromCurrency: invoice.currency,
            toCurrency: invoice.currency,
            rate: 1,
          },
          includePreviousDebt: (invoice.summary.previousDebtAmount || 0) > 0,
          selectedPreviousDebts: invoice.includedPreviousDebts || [],
          manualExpeditions: invoice.manualExpeditions || [],
          manualOrders: [],
          refundProcessingFee: invoice.fees.refundProcessingFees || 0,
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
        }}
      />
      </div>

      {/* Hidden Print Component */}
      <div id="print-invoice-content" style={{ display: 'none' }}>
        {/* TODO: Add print version of debt invoice preview */}
      </div>
    </div>
  );
}
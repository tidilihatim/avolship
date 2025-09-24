'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Calendar, Building, Save, Receipt } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InvoiceConfigurationForm from './invoice-configuration-form';
import DebtInvoicePreview from './debt-invoice-preview';
import SellerInvoicePreview from './seller-invoice-preview';

import { getSellerWarehouses } from '@/app/actions/invoice';
import { generateDebtInvoicePreview, createDebtInvoice } from '@/app/actions/debt-invoice';
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

interface InvoicePreview {
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

  // Correct model - Only fees charged
  expeditionFeesOwed: number; // Expedition fees (weight × fee per KG)
  serviceFees: number; // Service fees (refund, custom, etc.)
  legacyFees: number; // Legacy fees (confirmation, warehouse, shipping, etc.)
  totalFeesOwed: number; // Total amount seller owes us
  sellerProfitability: boolean; // Is seller profitable?

  // Sales info for display only (NOT in calculation)
  sellerSalesRevenue: number; // For reference only

  // Legacy compatibility
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
    status: string;
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
    totalDiscountAmount?: number;
    statusComment?: string;
  }>;

  refundData: Array<{
    orderId: string;
    refundDate: string | Date;
    customerName: string;
    customerPhone: string;
    products: Array<{
      productId: string;
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

  // Currency conversion
  currencyConversion?: {
    enabled: boolean;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
  } | null;
}


interface InvoiceGenerationPageProps {
  seller: Seller;
}

export default function InvoiceGenerationPage({ seller }: InvoiceGenerationPageProps) {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [configuration, setConfiguration] = useState<DebtInvoiceConfiguration>({
    startDate: '',
    endDate: '',
    warehouseId: '',
    paymentMethod: 'bank_transfer',
    customFees: [],
    currencyConversion: {
      enabled: false,
      fromCurrency: '',
      toCurrency: '',
      rate: 1,
    },
    includePreviousDebt: false,
    selectedPreviousDebts: [],
    manualExpeditions: [],
    manualOrders: [],
    refundProcessingFee: 0,
    fees: {
      confirmationFee: 0,
      serviceFee: 0,
      warehouseFee: 0,
      shippingFee: 0,
      processingFee: 0,
      expeditionFee: 0,
    },
    notes: '',
    terms: 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.',
  });

  // Load warehouses on component mount
  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setWarehousesLoading(true);
    try {
      const result = await getSellerWarehouses(seller._id);
      if (result.success) {
        setWarehouses(result.data || []);
      } else {
        setError(result.message || 'Failed to load warehouses');
      }
    } catch (err) {
      setError('Failed to load warehouses');
    } finally {
      setWarehousesLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!configuration.startDate || !configuration.endDate || !configuration.warehouseId) {
      setError('Please fill in all required fields');
      return;
    }

    setPreviewLoading(true);
    setError(null);

    try {
      const result = await generateDebtInvoicePreview({
        sellerId: seller._id,
        warehouseId: configuration.warehouseId,
        periodStart: configuration.startDate,
        periodEnd: configuration.endDate,
        paymentMethod: configuration.paymentMethod,
        customFees: configuration.customFees,
        manualExpeditions: configuration.manualExpeditions,
        manualOrders: configuration.manualOrders,
        selectedPreviousDebts: configuration.selectedPreviousDebts,
        currencyConversion: configuration.currencyConversion,
        refundProcessingFee: configuration.refundProcessingFee,
        fees: configuration.fees,
      });

      if (result.success && result.data) {
        setPreview(result.data);
      } else {
        setError(result.message || 'Failed to generate preview');
      }
    } catch (err) {
      setError('Failed to generate preview. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!preview) return;

    setGenerating(true);
    setError(null);

    try {
      const result = await createDebtInvoice({
        sellerId: seller._id,
        warehouseId: configuration.warehouseId,
        periodStart: configuration.startDate,
        periodEnd: configuration.endDate,
        paymentMethod: configuration.paymentMethod,
        customFees: configuration.customFees,
        manualExpeditions: configuration.manualExpeditions,
        manualOrders: configuration.manualOrders,
        selectedPreviousDebts: configuration.selectedPreviousDebts,
        currencyConversion: configuration.currencyConversion,
        refundProcessingFee: configuration.refundProcessingFee,
        fees: configuration.fees,
        notes: configuration.notes || undefined,
        terms: configuration.terms || undefined,
      });

      if (result.success) {
        const invoiceNumber = result.data && 'invoiceNumber' in result.data ? result.data.invoiceNumber : '';
        toast.success(`Invoice ${invoiceNumber} generated successfully!`);
        router.push('/dashboard/super_admin/users');
      } else {
        setError(result.message || 'Failed to generate invoice');
      }
    } catch (err) {
      setError('Failed to generate invoice. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedWarehouse = warehouses.find(w => w._id === configuration.warehouseId);

  // Update currency conversion base currency when warehouse is selected
  useEffect(() => {
    if (selectedWarehouse) {
      setConfiguration(prev => ({
        ...prev,
        currencyConversion: {
          ...prev.currencyConversion,
          fromCurrency: selectedWarehouse.currency
        }
      }));
    }
  }, [selectedWarehouse]);

  return (
    <div className=" p-6 ">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/super_admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Invoice</h1>
          <p className="text-muted-foreground">
            Create an invoice for {seller.name} ({seller.email})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Invoice Configuration
              </CardTitle>
              <CardDescription>
                Configure the invoice parameters and fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceConfigurationForm
                configuration={configuration}
                setConfiguration={setConfiguration}
                warehouses={warehouses}
                warehousesLoading={warehousesLoading}
                onPreview={handlePreview}
                previewLoading={previewLoading}
                error={error}
                sellerId={seller._id}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Generating Invoice...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Generate & Save Invoice
                    </>
                  )}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const printContent = document.getElementById('admin-invoice-preview');
                      if (!printContent) {
                        alert('No invoice preview found. Please generate a preview first.');
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
                            <title>Invoice ${preview?.sellerName || 'Preview'}</title>
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

                              /* Logo size control - slightly larger but still compact */
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
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Print opens invoice in new tab for easy printing
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Admin Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Admin Preview
              </CardTitle>
              <CardDescription>
                Complete invoice with all financial details and processing fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div id="admin-invoice-preview">
                  <DebtInvoicePreview
                    seller={seller}
                    warehouse={selectedWarehouse}
                    preview={preview}
                    configuration={configuration}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Preview Available</h3>
                  <p className="text-muted-foreground">
                    Configure the invoice parameters and click "Generate Preview" to see the invoice
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seller Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Seller Preview
              </CardTitle>
              <CardDescription>
                Invoice as the seller will see it (no processing fees or profitability status)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div id="seller-invoice-preview">
                  <SellerInvoicePreview
                    seller={seller}
                    warehouse={selectedWarehouse}
                    preview={preview}
                    configuration={configuration}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Preview Available</h3>
                  <p className="text-muted-foreground">
                    Configure the invoice parameters and click "Generate Preview" to see the seller's view
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Calendar, Building, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InvoiceConfigurationForm from './invoice-configuration-form';
import ProfessionalInvoicePreview from './professional-invoice-preview';

import { getSellerWarehouses, generateInvoicePreview, generateInvoice } from '@/app/actions/invoice';

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
  
  const [configuration, setConfiguration] = useState<InvoiceConfiguration>({
    startDate: '',
    endDate: '',
    warehouseId: '',
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
      const result = await generateInvoicePreview({
        sellerId: seller._id,
        warehouseId: configuration.warehouseId,
        periodStart: configuration.startDate,
        periodEnd: configuration.endDate,
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
      const result = await generateInvoice({
        sellerId: seller._id,
        warehouseId: configuration.warehouseId,
        periodStart: configuration.startDate,
        periodEnd: configuration.endDate,
        fees: configuration.fees,
        notes: configuration.notes || undefined,
        terms: configuration.terms || undefined,
      });

      if (result.success) {
        const invoiceNumber = result.data && 'invoiceNumber' in result.data ? result.data.invoiceNumber : '';
        toast.success(`Invoice ${invoiceNumber} generated successfully!`);
        router.push('/dashboard/admin/users');
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/users">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      const printContent = document.getElementById('invoice-preview');
                      if (printContent) {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <title>Invoice ${preview?.sellerName}</title>
                                <style>
                                  body { 
                                    font-family: Arial, sans-serif; 
                                    margin: 0; 
                                    padding: 20px;
                                    background: white;
                                    color: #000;
                                  }
                                  .invoice-content {
                                    max-width: 800px;
                                    margin: 0 auto;
                                    background: white;
                                    border: 1px solid #ccc;
                                    border-radius: 8px;
                                    padding: 40px;
                                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                  }
                                  h1, h2, h3 { color: #1a1a1a; }
                                  .text-muted { color: #666; }
                                  .text-primary { color: #1c2d51; }
                                  .text-destructive { color: #dc2626; }
                                  .bg-muted { background: #f8f9fa; }
                                  .border { border: 1px solid #e2e8f0; }
                                  .border-b { border-bottom: 1px solid #e2e8f0; }
                                  table { border-collapse: collapse; width: 100%; }
                                  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                                  th { background: #f8f9fa; font-weight: 600; }
                                  .text-right { text-align: right; }
                                  .text-center { text-align: center; }
                                  .font-bold { font-weight: 700; }
                                  .font-semibold { font-weight: 600; }
                                  .font-medium { font-weight: 500; }
                                  .text-sm { font-size: 14px; }
                                  .text-xs { font-size: 12px; }
                                  .text-lg { font-size: 18px; }
                                  .text-xl { font-size: 20px; }
                                  .text-2xl { font-size: 24px; }
                                  .text-3xl { font-size: 30px; }
                                  .mb-2 { margin-bottom: 8px; }
                                  .mb-3 { margin-bottom: 12px; }
                                  .mb-4 { margin-bottom: 16px; }
                                  .mb-6 { margin-bottom: 24px; }
                                  .mb-8 { margin-bottom: 32px; }
                                  .mt-1 { margin-top: 4px; }
                                  .mt-2 { margin-top: 8px; }
                                  .p-3 { padding: 12px; }
                                  .p-4 { padding: 16px; }
                                  .py-2 { padding-top: 8px; padding-bottom: 8px; }
                                  .py-3 { padding-top: 12px; padding-bottom: 12px; }
                                  .space-y-1 > * + * { margin-top: 4px; }
                                  .space-y-2 > * + * { margin-top: 8px; }
                                  .space-y-3 > * + * { margin-top: 12px; }
                                  .space-y-4 > * + * { margin-top: 16px; }
                                  .space-y-6 > * + * { margin-top: 24px; }
                                  .space-y-8 > * + * { margin-top: 32px; }
                                  .grid { display: grid; }
                                  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                                  .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                                  .gap-2 { gap: 8px; }
                                  .gap-4 { gap: 16px; }
                                  .gap-8 { gap: 32px; }
                                  .flex { display: flex; }
                                  .items-center { align-items: center; }
                                  .items-start { align-items: flex-start; }
                                  .justify-between { justify-content: space-between; }
                                  .justify-end { justify-content: flex-end; }
                                  .rounded-lg { border-radius: 8px; }
                                  .font-mono { font-family: monospace; }
                                  .w-full { width: 100%; }
                                  .max-w-md { max-width: 448px; }
                                  .overflow-hidden { overflow: hidden; }
                                  .whitespace-pre-wrap { white-space: pre-wrap; }
                                  .leading-relaxed { line-height: 1.625; }
                                  @media print {
                                    body { margin: 0; padding: 0; }
                                    .invoice-content { 
                                      box-shadow: none; 
                                      border: none; 
                                      padding: 20px;
                                      page-break-inside: avoid;
                                    }
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="invoice-content">
                                  ${printContent.innerHTML}
                                </div>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                          printWindow.close();
                        }
                      }
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

        {/* Invoice Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Invoice Preview
              </CardTitle>
              <CardDescription>
                Professional invoice preview as the seller will see it
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div id="invoice-preview">
                  <ProfessionalInvoicePreview
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
      </div>
    </div>
  );
}
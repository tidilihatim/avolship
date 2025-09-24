'use client';

import React from 'react';
import { format } from 'date-fns';

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
  status?: string;
  totalSales: number;
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
  }>;
  expeditionData?: Array<{
    expeditionId: string;
    expeditionCode: string;
    expeditionDate: string;
    totalValue: number;
    isPaid: boolean;
    status: string;
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
  };
  notes: string;
  terms: string;
}

interface PrintInvoicePreviewProps {
  seller: Seller;
  warehouse?: Warehouse;
  preview: InvoicePreview;
  configuration: InvoiceConfiguration;
  invoiceNumber?: string;
}

// AvolShip Logo Component
const AvolShipLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 5L5 12.5V27.5L20 35L35 27.5V12.5L20 5Z" fill="#1c2d51" />
    <path d="M20 5L35 12.5L20 20L5 12.5L20 5Z" fill="#f37922" />
    <path d="M20 20V35L35 27.5V12.5L20 20Z" fill="#1c2d51" opacity="0.8" />
    <path d="M20 20V35L5 27.5V12.5L20 20Z" fill="#1c2d51" opacity="0.6" />
  </svg>
);

export default function PrintInvoicePreview({
  seller,
  warehouse,
  preview,
  configuration,
  invoiceNumber,
}: PrintInvoicePreviewProps) {
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
    return preview.totalSales + preview.unpaidAmount;
  };

  const calculateNetAmount = () => {
    return calculateSubtotal() + calculateTotalFees();
  };

  // Generate invoice number for print
  const displayInvoiceNumber = invoiceNumber || `INV-${format(new Date(), 'yyyyMM')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return (
    <div className="print-invoice" style={{ 
      backgroundColor: '#ffffff', 
      color: '#000000', 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <style jsx>{`
        .print-invoice * {
          color: #000000 !important;
          background-color: transparent !important;
        }
        .print-invoice table {
          border-collapse: collapse;
          width: 100%;
        }
        .print-invoice th,
        .print-invoice td {
          border: 1px solid #d1d5db;
          padding: 8px;
          text-align: left;
        }
        .print-invoice th {
          background-color: #f9fafb !important;
          font-weight: bold;
        }
        .gray-50 {
          background-color: #f9fafb !important;
        }
        .gray-100 {
          background-color: #f3f4f6 !important;
        }
        .gray-200 {
          background-color: #e5e7eb !important;
        }
        .gray-300 {
          background-color: #d1d5db !important;
        }
        .gray-600 {
          color: #4b5563 !important;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .font-bold {
          font-weight: bold;
        }
        .font-medium {
          font-weight: 500;
        }
        .font-semibold {
          font-weight: 600;
        }
        .text-lg {
          font-size: 18px;
        }
        .text-xl {
          font-size: 20px;
        }
        .text-2xl {
          font-size: 24px;
        }
        .text-sm {
          font-size: 14px;
        }
        .text-xs {
          font-size: 12px;
        }
        .mb-2 {
          margin-bottom: 8px;
        }
        .mb-3 {
          margin-bottom: 12px;
        }
        .mb-4 {
          margin-bottom: 16px;
        }
        .mb-6 {
          margin-bottom: 24px;
        }
        .mt-2 {
          margin-top: 8px;
        }
        .p-2 {
          padding: 8px;
        }
        .p-3 {
          padding: 12px;
        }
        .gap-2 {
          gap: 8px;
        }
        .gap-3 {
          gap: 12px;
        }
        @media print {
          .print-invoice {
            margin: 0 !important;
            padding: 15px !important;
            max-width: none !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
          }
          .print-invoice h1 {
            font-size: 18px !important;
          }
          .print-invoice h2 {
            font-size: 16px !important;
          }
          .print-invoice h3 {
            font-size: 14px !important;
          }
          .print-invoice table {
            font-size: 11px !important;
          }
          .print-logo {
            width: 20px !important;
            height: 20px !important;
          }
        }
      `}</style>

      {/* Compact Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0' }}>AVOLSHIP</h1>
            <p style={{ fontSize: '12px', color: '#4b5563', margin: '0' }}>Logistics Platform</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>INVOICE</h2>
          <p style={{ fontSize: '18px', fontWeight: '500', color: '#4b5563', margin: '4px 0' }}>#{displayInvoiceNumber}</p>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '4px' }}>
              <span>Date:</span>
              <span style={{ fontWeight: '500' }}>{format(new Date(), 'MMM dd, yyyy')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <span>Status:</span>
              <span style={{ 
                fontSize: '12px',
                padding: '2px 6px',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                fontWeight: '500'
              }}>{preview?.status || "Generated"}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0' }}></div>

      {/* Billing Information - Compact */}
      <div className="content-section grid grid-cols-2 gap-6 mb-4">
        {/* Bill To */}
        <div>
          <h3 className="font-semibold mb-2 border-b border-gray-200 pb-1">Bill To</h3>
          <div className="text-sm space-y-1">
            <p className="font-semibold">{seller.businessName || seller.name}</p>
            {seller.businessName && seller.name && (
              <p className="text-gray-600">Contact: {seller.name}</p>
            )}
            <p className="text-gray-600">{seller.email}</p>
            {seller.phone && <p className="text-gray-600">{seller.phone}</p>}
            {seller.country && <p className="text-gray-600">{seller.country}</p>}
          </div>
        </div>

        {/* Invoice Details */}
        <div>
          <h3 className="font-semibold mb-2 border-b border-gray-200 pb-1">Invoice Details</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Service Period:</span>
              <span className="font-medium">
                {format(new Date(preview.periodStart), 'MMM dd')} - {format(new Date(preview.periodEnd), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Warehouse:</span>
              <span className="font-medium">{preview.warehouseName}</span>
            </div>
            <div className="flex justify-between">
              <span>Currency:</span>
              <span className="font-medium">{preview.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Orders:</span>
              <span className="font-medium">{preview.totalOrders}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0' }}></div>

      {/* Service Details - Compact */}
      <div className="content-section mb-4">
        <h3 className="font-semibold mb-3 border-b border-gray-200 pb-1">Service Details</h3>
        <div className="border border-gray-300 rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="text-left p-2 font-semibold">Description</th>
                <th className="text-center p-2 font-semibold">Qty</th>
                <th className="text-right p-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-2">
                  <div>
                    <p className="font-medium">Order Processing & Commission</p>
                    <p className="text-xs text-gray-600">
                      {preview.totalProducts} products • {preview.totalQuantity} items
                    </p>
                  </div>
                </td>
                <td className="p-2 text-center">{preview.totalOrders}</td>
                <td className="p-2 text-right font-medium">{formatCurrency(preview.totalSales)}</td>
              </tr>
              
              {preview.unpaidAmount > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="p-2">
                    <div>
                      <p className="font-medium">Unpaid Expeditions</p>
                      <p className="text-xs text-gray-600">
                        Outstanding payments for {preview.unpaidExpeditions} expeditions
                      </p>
                    </div>
                  </td>
                  <td className="p-2 text-center">{preview.unpaidExpeditions}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(preview.unpaidAmount)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Breakdown - Compact */}
      {preview.productData && preview.productData.length > 0 && (
        <div className="content-section mb-4">
          <h3 className="font-semibold mb-3 border-b border-gray-200 pb-1">Product Breakdown</h3>
          <div className="border border-gray-300 rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="text-left p-2 font-semibold">Code</th>
                  <th className="text-left p-2 font-semibold">Product</th>
                  <th className="text-center p-2 font-semibold">Qty</th>
                  <th className="text-right p-2 font-semibold">Sales</th>
                </tr>
              </thead>
              <tbody>
                {preview.productData.map((product, index) => (
                  <tr key={product.productId} className="border-b border-gray-200">
                    <td className="p-2 font-mono text-xs">{product.code}</td>
                    <td className="p-2">{product.name}</td>
                    <td className="p-2 text-center">{product.quantity}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(product.sales)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="p-2" colSpan={2}>Total</td>
                  <td className="p-2 text-center">{preview.totalQuantity}</td>
                  <td className="p-2 text-right">{formatCurrency(preview.totalSales)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Fees - Compact */}
      {calculateTotalFees() > 0 && (
        <div className="content-section mb-4">
          <h3 className="font-semibold mb-3 border-b border-gray-200 pb-1">Service Fees</h3>
          <div className="border border-gray-300 rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="text-left p-2 font-semibold">Fee Description</th>
                  <th className="text-right p-2 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {configuration.fees.confirmationFee > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-2">Order Confirmation Processing Fee</td>
                    <td className="p-2 text-right">{formatCurrency(configuration.fees.confirmationFee)}</td>
                  </tr>
                )}
                {configuration.fees.serviceFee > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-2">Platform Service Fee</td>
                    <td className="p-2 text-right">{formatCurrency(configuration.fees.serviceFee)}</td>
                  </tr>
                )}
                {configuration.fees.warehouseFee > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-2">Warehouse Management Fee</td>
                    <td className="p-2 text-right">{formatCurrency(configuration.fees.warehouseFee)}</td>
                  </tr>
                )}
                {configuration.fees.shippingFee > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-2">Shipping & Handling Fee</td>
                    <td className="p-2 text-right">{formatCurrency(configuration.fees.shippingFee)}</td>
                  </tr>
                )}
                {configuration.fees.processingFee > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-2">Transaction Processing Fee</td>
                    <td className="p-2 text-right">{formatCurrency(configuration.fees.processingFee)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Total - Compact */}
      <div className="flex justify-end mb-4">
        <div className="w-80 border border-gray-300 rounded">
          <div className="p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
            </div>
            
            {calculateTotalFees() > 0 && (
              <div className="flex justify-between">
                <span>Service Fees:</span>
                <span className="font-medium">+{formatCurrency(calculateTotalFees())}</span>
              </div>
            )}
            
            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }}></div>
            
            <div className="flex justify-between text-lg font-bold">
              <span>Amount Due:</span>
              <span>{formatCurrency(calculateNetAmount())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Footer */}
      <div className="text-center text-xs text-gray-600 border-t border-gray-200 pt-3">
        <p className="font-medium">Thank you for your business!</p>
        <p>Generated on {format(new Date(), 'PPP')} by Avolship Platform</p>
        <p>For questions: invoicing@avolship.com</p>
      </div>
    </div>
  );
}
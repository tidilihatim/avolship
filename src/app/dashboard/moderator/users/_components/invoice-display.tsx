'use client';

import React from 'react';
import { format } from 'date-fns';
import { FileText, Calendar, Building, User, Package, Truck, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  currency: string;
  notes?: string;
  terms?: string;
  generatedAt: Date;
  fees: {
    confirmationFee: number;
    serviceFee: number;
    warehouseFee: number;
    shippingFee: number;
    processingFee: number;
    totalFees: number;
  };
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
  sellerId: {
    name: string;
    email: string;
    businessName?: string;
    phone?: string;
    country?: string;
  };
  warehouseId: {
    name: string;
    country: string;
    currency: string;
    address?: string;
  };
  generatedBy: {
    name: string;
    email: string;
  };
}

interface Order {
  _id: string;
  orderId: string;
  customer: {
    name: string;
    phoneNumbers: string[];
    shippingAddress: string;
  };
  products: Array<{
    productId: {
      name: string;
      code: string;
    };
    quantity: number;
    unitPrice: number;
  }>;
  totalPrice: number;
  finalTotalPrice: number;
  status: string;
  createdAt: Date;
}

interface Expedition {
  _id: string;
  expeditionCode: string;
  expeditionDate: Date;
  weight: number;
  transportMode: string;
  status: string;
  totalValue: number;
  totalProducts: number;
  totalQuantity: number;
  isPaid: boolean;
  paidAt?: Date;
  paymentAmount?: number;
}

interface InvoiceDisplayProps {
  invoice: Invoice;
  orders: Order[];
  expeditions: Expedition[];
}

export default function InvoiceDisplay({ invoice, orders, expeditions }: InvoiceDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
      generated: { label: 'Generated', className: 'bg-blue-100 text-blue-800' },
      sent: { label: 'Sent', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  const unpaidExpeditions = expeditions.filter(exp => !exp.isPaid);

  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="h-6 w-6" />
                Invoice {invoice.invoiceNumber}
              </CardTitle>
              <CardDescription>
                Generated on {format(new Date(invoice.generatedAt), 'PPP')} by {invoice.generatedBy.name}
              </CardDescription>
            </div>
            <Badge variant="outline" className={getStatusBadge(invoice.status).className}>
              {getStatusBadge(invoice.status).label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seller Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Seller Information
              </div>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {invoice.sellerId.name}</div>
                <div><strong>Email:</strong> {invoice.sellerId.email}</div>
                {invoice.sellerId.businessName && (
                  <div><strong>Business:</strong> {invoice.sellerId.businessName}</div>
                )}
                {invoice.sellerId.phone && (
                  <div><strong>Phone:</strong> {invoice.sellerId.phone}</div>
                )}
                {invoice.sellerId.country && (
                  <div><strong>Country:</strong> {invoice.sellerId.country}</div>
                )}
              </div>
            </div>

            {/* Warehouse Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Building className="h-5 w-5" />
                Warehouse Information
              </div>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {invoice.warehouseId.name}</div>
                <div><strong>Country:</strong> {invoice.warehouseId.country}</div>
                <div><strong>Currency:</strong> {invoice.warehouseId.currency}</div>
                {invoice.warehouseId.address && (
                  <div><strong>Address:</strong> {invoice.warehouseId.address}</div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Invoice Period */}
          <div className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Calendar className="h-5 w-5" />
            Invoice Period
          </div>
          <div className="text-sm">
            <strong>Period:</strong> {format(new Date(invoice.periodStart), 'PPP')} - {format(new Date(invoice.periodEnd), 'PPP')}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{invoice.summary.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{invoice.summary.totalExpeditions}</div>
              <div className="text-sm text-muted-foreground">Total Expeditions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{invoice.summary.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{invoice.summary.totalQuantity}</div>
              <div className="text-sm text-muted-foreground">Total Quantity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer.phoneNumbers[0]}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.products.map((product, index) => (
                            <div key={index} className="text-sm">
                              {product.productId.name} ({product.quantity}x)
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(order.finalTotalPrice || order.totalPrice)}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), 'PPP')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No orders found for this period.</p>
          )}
        </CardContent>
      </Card>

      {/* Expeditions Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Expeditions ({expeditions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expeditions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expedition Code</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Transport</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expeditions.map((expedition) => (
                    <TableRow key={expedition._id}>
                      <TableCell className="font-medium">{expedition.expeditionCode}</TableCell>
                      <TableCell>{format(new Date(expedition.expeditionDate), 'PPP')}</TableCell>
                      <TableCell>{expedition.weight} kg</TableCell>
                      <TableCell className="capitalize">{expedition.transportMode}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {expedition.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(expedition.totalValue)}</TableCell>
                      <TableCell>
                        {expedition.isPaid ? (
                          <div>
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                            {expedition.paidAt && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(expedition.paidAt), 'PPP')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Unpaid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No expeditions found for this period.</p>
          )}
        </CardContent>
      </Card>

      {/* Unpaid Expeditions Warning */}
      {unpaidExpeditions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Unpaid Expeditions Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              There are <strong>{unpaidExpeditions.length}</strong> unpaid expeditions totaling{' '}
              <strong>{formatCurrency(invoice.summary.unpaidAmount)}</strong> that are included in this invoice.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Fee Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Fees Breakdown</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Confirmation Fee:</span>
                    <span>{formatCurrency(invoice.fees.confirmationFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee:</span>
                    <span>{formatCurrency(invoice.fees.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Warehouse Fee:</span>
                    <span>{formatCurrency(invoice.fees.warehouseFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee:</span>
                    <span>{formatCurrency(invoice.fees.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span>{formatCurrency(invoice.fees.processingFee)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total Calculation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Sales:</span>
                <span className="text-lg font-medium">{formatCurrency(invoice.summary.totalSales)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Fees:</span>
                <span className="text-lg font-medium">-{formatCurrency(invoice.summary.totalFees)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Net Amount:</span>
                <span className="text-lg font-medium">{formatCurrency(invoice.summary.netAmount)}</span>
              </div>
              {invoice.summary.totalTax > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg">Tax:</span>
                  <span className="text-lg font-medium">{formatCurrency(invoice.summary.totalTax)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Final Amount:</span>
                <span>{formatCurrency(invoice.summary.finalAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes and Terms */}
      {(invoice.notes || invoice.terms) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes:</h4>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="font-medium mb-2">Terms & Conditions:</h4>
                <p className="text-sm text-muted-foreground">{invoice.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
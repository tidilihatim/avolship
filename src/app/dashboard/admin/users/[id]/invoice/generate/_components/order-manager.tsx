'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ManualOrder } from '@/types/debt-invoice';
import { getSellerOrders, getAlreadyInvoicedItems } from '@/app/actions/debt-invoice';

interface AvailableOrder {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  products: Array<{
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
  }>;
  status: string;
  isAlreadyInvoiced: boolean;
  previousInvoiceNumber?: string;
}

interface OrderManagerProps {
  orders: ManualOrder[];
  onOrdersChange: (orders: ManualOrder[]) => void;
  currency: string;
  sellerId: string;
  warehouseId: string;
  startDate: string;
  endDate: string;
}

export default function OrderManager({
  orders,
  onOrdersChange,
  currency,
  sellerId,
  warehouseId,
  startDate,
  endDate
}: OrderManagerProps) {
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Load available orders when date range or warehouse changes
  useEffect(() => {
    if (sellerId && warehouseId && startDate && endDate) {
      loadAvailableOrders();
    }
  }, [sellerId, warehouseId, startDate, endDate]);

  // Initialize selected orders from props
  useEffect(() => {
    if (orders.length > 0) {
      setSelectedOrders(orders.filter(order => order.include).map(order => order.orderId));
    }
  }, [orders]);

  const loadAvailableOrders = async () => {
    setLoading(true);
    try {
      // Fetch both orders and already invoiced items
      const [ordersResult, invoicedResult] = await Promise.all([
        getSellerOrders(sellerId, warehouseId, startDate, endDate),
        getAlreadyInvoicedItems(sellerId)
      ]);

      if (ordersResult.success && ordersResult.data) {
        // Get set of already invoiced order IDs
        const invoicedOrderIds = new Set(
          invoicedResult.success ? invoicedResult.data?.orderIds || [] : []
        );
        const invoicedRefundIds = new Set(
          invoicedResult.success ? invoicedResult.data?.refundOrderIds || [] : []
        );

        // Combine delivered and refunded orders from the result
        const allOrders = [
          ...(ordersResult.data.deliveredOrders || []),
          ...(ordersResult.data.refundedOrders || [])
        ];

        // Transform orders to include invoice status information
        const transformedOrders = allOrders.map((order: any) => {
          const orderId = order._id || order.id;
          const isDeliveredAndInvoiced = invoicedOrderIds.has(orderId);
          const isRefundedAndInvoiced = invoicedRefundIds.has(orderId);
          const isInvoiced = isDeliveredAndInvoiced || isRefundedAndInvoiced;

          return {
            orderId: orderId,
            orderDate: order.orderDate || order.refundDate || order.createdAt,
            customerName: order.customerName || 'Unknown Customer',
            customerPhone: order.customerPhone || '',
            totalPrice: order.totalAmount || order.originalAmount || 0,
            products: order.products?.map((product: any) => ({
              productName: product.productName || 'Unknown Product',
              productCode: product.productCode || '',
              quantity: product.quantity || 0,
              unitPrice: product.unitPrice || 0,
            })) || [],
            status: order.status || 'pending',
            isAlreadyInvoiced: isInvoiced,
            previousInvoiceNumber: isInvoiced ? 'Previously Invoiced' : undefined,
          };
        });
        setAvailableOrders(transformedOrders);

        // Keep existing selection intact (previously invoiced orders can still be selected)
      } else {
        console.error('Failed to load orders:', ordersResult.message);
        setAvailableOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setAvailableOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = selectedOrders.includes(orderId)
      ? selectedOrders.filter(id => id !== orderId)
      : [...selectedOrders, orderId];

    setSelectedOrders(newSelected);
    updateManualOrders(newSelected);
  };

  const updateManualOrders = (selected: string[] = selectedOrders) => {
    const manualOrders: ManualOrder[] = availableOrders.map(order => ({
      orderId: order.orderId,
      include: selected.includes(order.orderId),
    }));

    onOrdersChange(manualOrders);
  };

  const getTotalOrderValue = () => {
    return availableOrders
      .filter(order => selectedOrders.includes(order.orderId))
      .filter(order => order.status === 'delivered') // Only count delivered orders as revenue
      .reduce((total, order) => total + order.totalPrice, 0);
  };

  const selectAllOrders = () => {
    const selectableOrderIds = availableOrders
      .map(order => order.orderId);
    setSelectedOrders(selectableOrderIds);
    updateManualOrders(selectableOrderIds);
  };

  const clearAllOrders = () => {
    setSelectedOrders([]);
    updateManualOrders([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Order Selection</Label>
        <p className="text-sm text-muted-foreground">
          Select orders from the date range to include in this invoice
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading available orders...</span>
          </CardContent>
        </Card>
      ) : availableOrders.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No orders found for this period</p>
              <p className="text-xs text-muted-foreground">Try adjusting the date range</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Available Orders ({availableOrders.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllOrders}
                disabled={selectedOrders.length === availableOrders.length}
              >
                Select All Available
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllOrders}
                disabled={selectedOrders.length === 0}
              >
                Clear All
              </Button>
              <div className="ml-auto text-sm text-muted-foreground">
                {selectedOrders.length} of {availableOrders.length} selected
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableOrders.map((order) => (
              <div
                key={order.orderId}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedOrders.includes(order.orderId)
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-background'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedOrders.includes(order.orderId)}
                    onCheckedChange={() => toggleOrderSelection(order.orderId)}
                  />
                  <div className="flex-1 space-y-3">
                    {/* Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="font-medium text-sm">Order #{order.orderId.slice(-8)}</div>
                        <div className="text-xs text-muted-foreground">
                          Date: {formatDate(order.orderDate)}
                        </div>
                        <Badge
                          variant={order.status === 'refunded' ? 'destructive' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {order.status}
                        </Badge>
                        {order.isAlreadyInvoiced && (
                          <Badge variant="destructive" className="text-xs mt-1 ml-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Previously Invoiced
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {formatCurrency(order.totalPrice)}
                          {order.status === 'refunded' && (
                            <span className="text-xs text-destructive ml-1">(not revenue)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Customer: {order.customerName}
                        </div>
                        {order.customerPhone && (
                          <div className="text-xs text-muted-foreground">
                            Phone: {order.customerPhone}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{order.products.length} Products</div>
                        <div className="text-xs text-muted-foreground">
                          {order.products.slice(0, 2).map(p => p.productName).join(', ')}
                          {order.products.length > 2 && '...'}
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    {selectedOrders.includes(order.orderId) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Product Details</Label>
                          <div className="grid gap-1">
                            {order.products.map((product, index) => (
                              <div key={index} className="flex justify-between items-center text-xs py-1">
                                <span className="text-muted-foreground">
                                  {product.productName} ({product.productCode})
                                </span>
                                <span className="font-medium">
                                  {product.quantity}x @ {formatCurrency(product.unitPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {selectedOrders.length > 0 && (
              <>
                <Separator />
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>Total Selected Order Value:</span>
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(getTotalOrderValue())}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seller's revenue from delivered orders only (refunded orders excluded)
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, AlertTriangle, ChevronDown, Download } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface ParsedProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ParsedOrder {
  orderId: string;
  products: ParsedProduct[];
  date: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  storeName: string;
  rowIndex: number;
  errors: string[];
  warnings: string[];
}

interface OrderPreviewProps {
  orders: ParsedOrder[];
  onImportOrders: (validOrders: ParsedOrder[]) => void;
  onExportCorrected: () => void;
  isImporting?: boolean;
  warehouseInfo?: { currency: string; name: string } | null;
}

export default function OrderPreview({
  orders,
  onImportOrders,
  onExportCorrected,
  isImporting = false,
  warehouseInfo
}: OrderPreviewProps) {
  const t = useTranslations('orders.import.results');
  const tStatus = useTranslations('orders.import.status');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // Currency formatter helper
  const formatCurrency = (amount: number) => {
    const currency = warehouseInfo?.currency || 'USD';
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const toggleOrderExpansion = (index: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedOrders(newExpanded);
  };

  const getOrderStatusBadge = (order: ParsedOrder) => {
    if (order.errors.length > 0) {
      return <Badge variant="destructive">{tStatus('errors')}</Badge>;
    }
    if (order.warnings.length > 0) {
      return <Badge variant="secondary">{tStatus('warnings')}</Badge>;
    }
    return <Badge variant="default">{tStatus('valid')}</Badge>;
  };

  const validOrders = orders.filter(order => order.errors.length === 0);
  const errorOrders = orders.filter(order => order.errors.length > 0);

  if (orders.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">{t('validOrders', { count: validOrders.length })}</span>
            </div>
            {errorOrders.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">{t('ordersWithErrors', { count: errorOrders.length })}</span>
              </div>
            )}
          </div>

          {/* Orders List */}
          <div className="space-y-2">
            {orders.map((order, index) => (
              <div key={index} className="border rounded-lg">
                <Collapsible
                  open={expandedOrders.has(index)}
                  onOpenChange={() => toggleOrderExpansion(index)}
                >
                  <CollapsibleTrigger className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{order.orderId}</span>
                        <span className="text-muted-foreground">{order.customer.name}</span>
                        {getOrderStatusBadge(order)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {t('products', { count: order.products.length })}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${
                          expandedOrders.has(index) ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {/* Customer Info */}
                      <div>
                        <h5 className="font-medium mb-1">{t('customerInfo')}</h5>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{t('name')}: {order.customer.name}</p>
                          <p>{t('phone')}: {order.customer.phone}</p>
                          <p>{t('address')}: {order.customer.address}</p>
                        </div>
                      </div>

                      {/* Products */}
                      <div>
                        <h5 className="font-medium mb-1">Products</h5>
                        <div className="space-y-1">
                          {order.products.map((product, prodIndex) => (
                            <div key={prodIndex} className="text-sm flex justify-between">
                              <span>{product.name} (ID: {product.id})</span>
                              <span>{t('quantity')}: {product.quantity} × {formatCurrency(product.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Errors and Warnings */}
                      {(order.errors.length > 0 || order.warnings.length > 0) && (
                        <div className="space-y-2">
                          {order.errors.map((error, errorIndex) => (
                            <Alert key={errorIndex} variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          ))}
                          {order.warnings.map((warning, warningIndex) => (
                            <Alert key={warningIndex}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>{warning}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {validOrders.length > 0 && (
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => onImportOrders(validOrders)}
                disabled={isImporting}
                className="flex gap-2"
              >
                {isImporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {t('importValidOrders', { count: validOrders.length })}
              </Button>
              <Button variant="outline" onClick={onExportCorrected}>
                <Download className="h-4 w-4 mr-2" />
                {t('exportCorrectedCsv')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
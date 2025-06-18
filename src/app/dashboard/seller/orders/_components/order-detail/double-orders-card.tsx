'use client';

import { useTranslations } from 'next-intl';
import { Users, Eye, AlertTriangle, CheckCircle, Copy, Clock, Calendar, Package } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FieldType } from '@/types/duplicate-detection';
import { getDuplicateOrdersDetails } from '@/app/actions/order';

interface DoubleOrdersCardProps {
  order: any;
  userRole?: string;
  formatDate: (date: Date | string) => string;
}

// Helper function to get field value from order
const getFieldValue = (order: any, field: FieldType): string => {
  switch (field) {
    case FieldType.CUSTOMER_NAME:
      return order?.customer?.name || '';
    case FieldType.CUSTOMER_PHONE:
      return order?.customer?.phoneNumbers?.join(', ') || '';
    case FieldType.CUSTOMER_ADDRESS:
      return order?.customer?.shippingAddress || '';
    case FieldType.PRODUCT_ID:
      return order?.products?.map((p: any) => {
        const code = p.code || p.productCode;
        const name = p.name || p.productName;
        return code ? `${code}${name ? ` (${name})` : ''}` : name || p.productId;
      }).join(', ') || '';
    case FieldType.PRODUCT_NAME:
      return order?.products?.map((p: any) => {
        const code = p.code || p.productCode;
        const name = p.name || p.productName;
        return code ? `${code}${name ? ` (${name})` : ''}` : name || 'Unknown Product';
      }).join(', ') || '';
    case FieldType.PRODUCT_CODE:
      return order?.products?.map((p: any) => {
        const code = p.code || p.productCode;
        const name = p.name || p.productName;
        return code ? `${code}${name ? ` (${name})` : ''}` : name || 'No Code';
      }).join(', ') || '';
    case FieldType.ORDER_TOTAL:
      return order?.totalPrice?.toString() || '';
    case FieldType.WAREHOUSE:
      return order?.warehouseName || order?.warehouse?.name || order?.warehouseId || '';
    default:
      return '';
  }
};

// Helper function to get human-readable field name
const getFieldLabel = (field: FieldType, t: any): string => {
  switch (field) {
    case FieldType.CUSTOMER_NAME:
      return t('fields.customerName');
    case FieldType.CUSTOMER_PHONE:
      return t('fields.phoneNumbers');
    case FieldType.CUSTOMER_ADDRESS:
      return t('fields.shippingAddress');
    case FieldType.PRODUCT_ID:
      return t('fields.products');
    case FieldType.PRODUCT_NAME:
      return t('products.productName');
    case FieldType.PRODUCT_CODE:
      return t('products.productCode');
    case FieldType.ORDER_TOTAL:
      return t('fields.totalPrice');
    case FieldType.WAREHOUSE:
      return t('fields.warehouse');
    default:
      return field;
  }
};

// Helper function to get rule conditions from duplicate settings
const getRuleConditions = (ruleName: string, duplicateSettings: any): FieldType[] => {
  if (!duplicateSettings || !duplicateSettings.rules) {
    // Fallback to parsing from rule name if settings not available
    return parseRuleConditionsFromName(ruleName);
  }
  
  // Find the matching rule in the settings
  const rule = duplicateSettings.rules.find((r: any) => r.name === ruleName);
  if (!rule || !rule.conditions) {
    return parseRuleConditionsFromName(ruleName);
  }
  
  // Extract enabled field types from the rule conditions
  return rule.conditions
    .filter((condition: any) => condition.enabled)
    .map((condition: any) => condition.field as FieldType);
};

// Fallback function to parse rule conditions from rule name
const parseRuleConditionsFromName = (ruleName: string): FieldType[] => {
  const conditions: FieldType[] = [];
  
  if (ruleName.toLowerCase().includes('customer') || ruleName.toLowerCase().includes('name')) {
    conditions.push(FieldType.CUSTOMER_NAME);
  }
  if (ruleName.toLowerCase().includes('phone')) {
    conditions.push(FieldType.CUSTOMER_PHONE);
  }
  if (ruleName.toLowerCase().includes('address')) {
    conditions.push(FieldType.CUSTOMER_ADDRESS);
  }
  if (ruleName.toLowerCase().includes('product')) {
    conditions.push(FieldType.PRODUCT_NAME);
  }
  if (ruleName.toLowerCase().includes('total') || ruleName.toLowerCase().includes('price')) {
    conditions.push(FieldType.ORDER_TOTAL);
  }
  if (ruleName.toLowerCase().includes('warehouse')) {
    conditions.push(FieldType.WAREHOUSE);
  }
  
  // Default fallback
  if (conditions.length === 0) {
    conditions.push(FieldType.CUSTOMER_NAME, FieldType.CUSTOMER_PHONE);
  }
  
  return conditions;
};

export default function DoubleOrdersCard({ order, userRole, formatDate }: DoubleOrdersCardProps) {
  console.log(order)
  const t = useTranslations('orders');
  const [duplicateOrders, setDuplicateOrders] = useState<Record<string, any>>({});
  const [duplicateSettings, setDuplicateSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch duplicate orders data
  useEffect(() => {
    const fetchDuplicateOrders = async () => {
      if (!order.doubleOrderReferences || order.doubleOrderReferences.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const orderIds = order.doubleOrderReferences.map((ref: any) => ref.orderId);
        const result = await getDuplicateOrdersDetails(orderIds, order.sellerId);
        
        if (result.success) {
          // Convert array to object for easier lookup
          const duplicatesMap: Record<string, any> = {};
          result.duplicateOrders.forEach((duplicateOrder: any) => {
            duplicatesMap[duplicateOrder._id] = duplicateOrder;
          });
          
          setDuplicateOrders(duplicatesMap);
          setDuplicateSettings(result.duplicateSettings);
        } else {
          console.error('Failed to fetch duplicate orders:', result.message);
        }
      } catch (error) {
        console.error('Failed to fetch duplicate orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDuplicateOrders();
  }, [order.doubleOrderReferences, order.sellerId]);

  if (!order.isDouble || !order.doubleOrderReferences || order.doubleOrderReferences.length === 0) {
    return null;
  }

  return (
    <Card id='double' className="">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Copy className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('doubleOrderDetection.title')}</CardTitle>
        </div>
        <CardDescription className="mt-2">
          {t('doubleOrderDetection.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {order.doubleOrderReferences.map((ref: any, index: number) => {
            const duplicateOrder = duplicateOrders[ref.orderId];
            const ruleConditions = getRuleConditions(ref.matchedRule, duplicateSettings);
            const productCount = duplicateOrder?.products?.length || 0;
            
            return (
              <div key={index} className="border rounded-xl p-4 sm:p-6 bg-card shadow-sm">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          {/* Product count badge */}
                          <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full border-2 bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold">{t('doubleOrderDetection.similarOrderFound')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {duplicateOrder ? `${duplicateOrder.customer?.name || 'Loading...'}` : 'Loading details...'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-background border px-3 py-2 rounded-lg">
                          <code className="text-xs sm:text-sm font-mono text-foreground">
                            {ref.orderNumber}
                          </code>
                        </div>
                        {duplicateOrder && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {duplicateOrder.orderDate ? new Date(duplicateOrder.orderDate).toLocaleDateString() : 'N/A'}
                          </div>
                        )}
                        {duplicateOrder?.totalPrice && (
                          <div className="text-xs font-medium bg-muted/50 px-2 py-1 rounded">
                            ${duplicateOrder.totalPrice}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right space-y-2">
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                        <Link href={`/dashboard/${userRole}/orders/${ref.orderId}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t('actions.viewOrder')}
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Rule-based Detection Information */}
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {t('doubleOrderDetection.detectionRule')}
                          </p>
                          <Badge variant="secondary" className="font-medium">
                            {ref.matchedRule}
                          </Badge>
                        </div>
                        <div className="text-left sm:text-right space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t('doubleOrderDetection.detectedAt')}
                          </p>
                          <p className="text-xs font-mono bg-background px-2 py-1 rounded border">
                            {ref.detectedAt ? formatDate(ref.detectedAt) : t('time.notAvailable')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Matching Conditions Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <h5 className="text-sm font-semibold">
                          {t('doubleOrderDetection.ruleConditions')}
                        </h5>
                      </div>
                      
                      <div className="grid gap-3">
                        {ruleConditions.map((condition) => {
                          const currentValue = getFieldValue(order, condition);
                          const duplicateValue = duplicateOrder ? getFieldValue(duplicateOrder, condition) : (loading ? 'Loading...' : 'N/A');
                          const isMatching = !loading && duplicateOrder && currentValue === duplicateValue && currentValue !== '';
                          
                          return (
                            <div key={condition} className={`border rounded-lg p-4 transition-all ${isMatching ? 'border-primary bg-primary/5 shadow-sm' : 'bg-muted/20'}`}>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium flex items-center gap-2">
                                    {isMatching && <CheckCircle className="h-4 w-4 text-primary" />}
                                    {getFieldLabel(condition, t)}
                                  </span>
                                  {isMatching && (
                                    <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-xs">
                                      {t('doubleOrderDetection.matchHighlight')}
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {t('doubleOrderDetection.currentOrderValue')}
                                    </p>
                                    <div className={`text-sm px-3 py-2 rounded-md bg-background border ${isMatching ? 'border-primary/30 font-medium' : ''}`}>
                                      {currentValue || t('time.notAvailable')}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {t('doubleOrderDetection.duplicateOrderValue')}
                                    </p>
                                    <div className={`text-sm px-3 py-2 rounded-md bg-background border ${isMatching ? 'border-primary/30 font-medium' : ''}`}>
                                      {duplicateValue || t('time.notAvailable')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="bg-muted/30 border-l-4 border-l-primary p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium mb-2">
                            {t('doubleOrderDetection.warningTitle')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('doubleOrderDetection.ruleBasedMessage', { rule: ref.matchedRule })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
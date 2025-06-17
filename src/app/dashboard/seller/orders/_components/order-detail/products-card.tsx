'use client';

import { useTranslations } from 'next-intl';
import { Package } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ProductsCardProps {
  order: any;
  formatPrice: (price: number, warehouseId?: string) => string;
}

export default function ProductsCard({ order, formatPrice }: ProductsCardProps) {
  const t = useTranslations('orders');

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('sections.productsList')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {order.products && order.products.length > 0 ? (
            order.products.map((product: any, index: number) => (
              <div key={product.productId || index} className="border rounded-xl p-4 sm:p-6 bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold truncate">{product.productName}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="bg-background border px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-mono">
                          {product.productCode}
                        </code>
                        {product.variantCode && (
                          <code className="bg-muted border px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-mono">
                            {product.variantCode}
                          </code>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm sm:text-base px-3 sm:px-4 py-2 whitespace-nowrap">
                      {t('products.qty')}: {product.quantity}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">{t('products.unitPrice')}</span>
                      <p className="font-semibold text-sm sm:text-base">
                        {formatPrice(product.unitPrice, order.warehouseId)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t('products.quantity')}</span>
                      <p className="font-semibold text-sm sm:text-base">{product.quantity}</p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-sm text-muted-foreground">{t('products.subtotal')}</span>
                      <p className="font-bold text-base sm:text-lg">
                        {formatPrice(product.unitPrice * product.quantity, order.warehouseId)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t('messages.noProductsInOrder')}</p>
            </div>
          )}
          
          {order.products && order.products.length > 0 && (
            <>
              <Separator />
              <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between text-xl sm:text-2xl font-bold">
                  <span>{t('products.orderTotal')}:</span>
                  <span>{formatPrice(order.totalPrice, order.warehouseId)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
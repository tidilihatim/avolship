'use client';

// src/app/[locale]/dashboard/seller/products/[id]/_components/product-details.tsx
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Edit, ArrowLeft, Package, MapPin, Tag, Building2, Calendar, DollarSign, Hash, Eye, History, AlertTriangle, TrendingUp, TrendingDown, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { ProductStatus } from '@/lib/db/models/product';
import { updateProductStatus } from '@/app/actions/product';
import { UserRole } from '@/lib/db/models/user';

interface ProductDetailsProps {
  product: any;
  userRole?: string;
}

/**
 * ProductDetails Component
 * Displays detailed information about a product
 */
export default function ProductDetails({ product, userRole }: ProductDetailsProps) {
  const t = useTranslations();
  const router = useRouter();

  // Check if user is admin or moderator
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
  
  // Get status configuration
  const getStatusConfig = (status: ProductStatus) => {
    const statusConfigs = {
      [ProductStatus.ACTIVE]: { 
        label: t('products.statuses.active'), 
        description: t('products.statuses.descriptions.active'),
        className: 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200' 
      },
      [ProductStatus.INACTIVE]: { 
        label: t('products.statuses.inactive'), 
        description: t('products.statuses.descriptions.inactive'),
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200' 
      },
      [ProductStatus.OUT_OF_STOCK]: { 
        label: t('products.statuses.out_of_stock'), 
        description: t('products.statuses.descriptions.out_of_stock'),
        className: 'bg-red-50 text-red-700 hover:bg-red-50 border-red-200' 
      }
    };
    return statusConfigs[status] || { 
      label: t('common.unknown'), 
      description: 'Unknown status',
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200' 
    };
  };

  const statusConfig = getStatusConfig(product.status);
  
  // Handle status update
  const handleStatusUpdate = async (newStatus: ProductStatus) => {
    const result = await updateProductStatus(product._id, newStatus);
    
    if (result.success) {
      toast.success(t('products.productUpdated'));
      router.refresh();
    } else {
      toast.error(result.message || 'Failed to update status');
    }
  };

  // Format price with currency
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Get stock level indicator
  const getStockLevelConfig = (stock: number) => {
    if (stock === 0) {
      return {
        label: t('products.outOfStock'),
        className: 'bg-red-50 text-red-700 hover:bg-red-50 border-red-200',
        icon: AlertTriangle
      };
    } else if (stock < 10) {
      return {
        label: t('products.lowStockWarning'),
        className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200',
        icon: TrendingDown
      };
    } else {
      return {
        label: t('products.inStock'),
        className: 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200',
        icon: TrendingUp
      };
    }
  };

  const stockConfig = getStockLevelConfig(product.totalStock);
  const StockIcon = stockConfig.icon;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/seller/products')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              {product.image?.url ? (
                <img
                  src={product.image.url}
                  alt={product.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Package className="h-5 w-5" />
              )}
            </div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
          </div>
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Quick Actions */}
          {product.status !== ProductStatus.ACTIVE && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate(ProductStatus.ACTIVE)}
              className="text-green-600 hover:text-green-700"
            >
              {t('products.actions.markAsActive')}
            </Button>
          )}
          {product.status !== ProductStatus.INACTIVE && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate(ProductStatus.INACTIVE)}
              className="text-gray-600 hover:text-gray-700"
            >
              {t('products.actions.markAsInactive')}
            </Button>
          )}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            asChild
          >
            <Link href={`/dashboard/seller/products/stock-history/${product._id}`}>
              <History className="h-4 w-4" />
              {t('products.viewStockHistory')}
            </Link>
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.push(`/dashboard/seller/products/${product._id}/edit`)}
          >
            <Edit className="h-4 w-4" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('products.sections.basicInfo')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('products.fields.productName')}
                </p>
                <p className="text-base font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('products.fields.productCode')}
                </p>
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    {product.code}
                  </code>
                </div>
              </div>
              {product.variantCode && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('products.fields.variantCode')}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      {product.variantCode}
                    </code>
                  </div>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('products.fields.description')}
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted p-3 rounded-md">
                  {product.description}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('products.fields.creationDate')}
                </p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">
                    {format(new Date(product.createdAt), 'PPP')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('products.fields.lastUpdated')}
                </p>
                <p className="text-base">
                  {format(new Date(product.updatedAt), 'PPP p')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Stock */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('products.sections.pricingStock')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('products.fields.price')}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(product.price)}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('products.fields.totalStock')}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-2xl font-bold">
                    {product.totalStock}
                  </p>
                  <Badge variant="outline" className={stockConfig.className}>
                    <StockIcon className="mr-1 h-3 w-3" />
                    {stockConfig.label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('products.fields.status')}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusConfig.description}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Product ID
                </p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {product._id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Image */}
        {product.image?.url && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('products.sections.productImage')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                <img
                  src={product.image.url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Image ID: {product.image.publicId}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Warehouse Stock Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('products.sections.warehouseDistribution')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {product.warehouses && product.warehouses.length > 0 ? (
                product.warehouses.map((warehouse: any, index: number) => (
                  <div key={warehouse.warehouseId || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {warehouse.warehouseName || `Warehouse ${index + 1}`}
                        </p>
                        {warehouse.country && (
                          <p className="text-sm text-muted-foreground">
                            {warehouse.country}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {warehouse.stock}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('products.fields.inStock')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('products.messages.noWarehousesConfigured')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seller Information (Admin/Moderator only) */}
        {isAdminOrModerator && product.sellerInfo && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('products.sections.sellerInfo')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('products.fields.sellerName')}
                  </p>
                  <p className="text-base font-medium">{product.sellerInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('products.fields.sellerEmail')}
                  </p>
                  <p className="text-base">{product.sellerInfo.email}</p>
                </div>
                {product.sellerInfo.businessName && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('products.fields.businessName')}
                      </p>
                      <p className="text-base">{product.sellerInfo.businessName}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        {product.verificationLink && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('products.sections.additionalInfo')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('products.fields.verificationLink')}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={product.verificationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline truncate"
                    >
                      {product.verificationLink}
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
// src/app/dashboard/call_center/products/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Edit, Package, MapPin, User, Calendar, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProductById } from "@/app/actions/product";
import { ProductStatus } from "@/lib/db/models/product";

export const metadata: Metadata = {
  title: "Product Details | Call Center",
  description: "View detailed product information",
};

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CallCenterProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const t = await getTranslations("products");

  // Fetch product details
  const { product, success } = await getProductById(productId);

  if (!success || !product) {
    notFound();
  }

  // Get status badge variant
  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.ACTIVE:
        return <Badge variant="default" className="bg-green-100 text-green-800">{t("statuses.active")}</Badge>;
      case ProductStatus.INACTIVE:
        return <Badge variant="secondary">{t("statuses.inactive")}</Badge>;
      case ProductStatus.OUT_OF_STOCK:
        return <Badge variant="destructive">{t("statuses.out_of_stock")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get stock badge variant based on stock level
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">{stock} {t("units")}</Badge>;
    } else if (stock <= 10) {
      return <Badge variant="secondary">{stock} {t("units")}</Badge>;
    } else {
      return <Badge variant="default">{stock} {t("units")}</Badge>;
    }
  };

  return (
    <div className="px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/call_center/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToProducts")}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("productDetails")}</h1>
            <p className="text-muted-foreground">{t("viewProductInfo")}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/call_center/products/${productId}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              {t("editProduct")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Product Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("sections.basicInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                {product.image ? (
                  <img
                    src={product.image.url}
                    alt={product.name}
                    className="w-24 h-24 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-2xl font-semibold">{product.name}</h2>
                    <p className="text-muted-foreground">{product.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(product.status)}
                    {getStockBadge(product.totalStock)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("fields.productCode")}</label>
                  <p className="font-mono text-lg">{product.code}</p>
                </div>

                {product.variantCode && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("fields.variantCode")}</label>
                    <p className="font-mono text-lg">{product.variantCode}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("table.totalStock")}</label>
                  <p className="text-lg">{product.totalStock} {t("units")}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("table.availableStock")}</label>
                  <p className="text-lg">{product.availableStock ?? 0} {t("units")}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("table.inTransit")}</label>
                  <p className="text-lg text-blue-600">{product.totalInTransit ?? 0} {t("units")}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("table.delivered")}</label>
                  <p className="text-lg text-green-600">{product.totalDelivered ?? 0} {t("units")}</p>
                </div>
              </div>

              {product.verificationLink && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("fields.verificationLink")}</label>
                    <div className="mt-1">
                      <a
                        href={product.verificationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        {product.verificationLink}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Warehouse Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("sections.warehouseDistribution")}
              </CardTitle>
              <CardDescription>
                {t("warehouseStockLevels")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.warehouses.map((warehouse) => (
                  <div key={warehouse.warehouseId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{warehouse.warehouseName}</h3>
                      {warehouse.country && (
                        <p className="text-sm text-muted-foreground">{warehouse.country}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {getStockBadge(warehouse.stock)}
                      {(warehouse.defectiveQuantity ?? 0) > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {warehouse.defectiveQuantity} {t("table.defectiveQuantity").toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {product.warehouses.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {t("noWarehousesAssigned")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("sections.sellerInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="font-medium">{product.sellerName}</h3>
                <p className="text-sm text-muted-foreground">ID: {product.sellerId}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("timeline")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("created")}</label>
                <p className="text-sm">{new Date(product.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("lastUpdated")}</label>
                <p className="text-sm">{new Date(product.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t("quickStats")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("warehouses")}</span>
                <span className="font-medium">{product.warehouses.length}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("table.totalStock")}</span>
                <span className="font-medium">{product.totalStock}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("table.defectiveQuantity")}</span>
                <span className="font-medium text-red-600">{product.totalDefectiveQuantity ?? 0}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("status")}</span>
                <span className="font-medium">{product.status}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

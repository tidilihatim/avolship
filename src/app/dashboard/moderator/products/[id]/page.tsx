// src/app/dashboard/moderator/products/[id]/page.tsx
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Package, MapPin, User, Calendar, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProductById } from "@/app/actions/product";
import { getLoginUserRole } from "@/app/actions/auth";
import { UserRole } from "@/lib/db/models/user";
import { ProductStatus } from "@/lib/db/models/product";
import ProductDeleteButton from "./product-delete-button";

export const metadata: Metadata = {
  title: "Product Details | AvolShip Moderator",
  description: "View detailed product information",
};

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModeratorProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // Check if user has admin/moderator access
  const userRole = await getLoginUserRole();
  if (![UserRole.ADMIN, UserRole.MODERATOR].includes(userRole)) {
    redirect('/dashboard');
  }

  // Fetch product details
  const { product, success, message } = await getProductById(productId);

  if (!success || !product) {
    notFound();
  }

  // Get status badge variant
  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.ACTIVE:
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case ProductStatus.INACTIVE:
        return <Badge variant="secondary">Inactive</Badge>;
      case ProductStatus.OUT_OF_STOCK:
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get stock badge variant based on stock level
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">{stock} units</Badge>;
    } else if (stock <= 10) {
      return <Badge variant="secondary">{stock} units</Badge>;
    } else {
      return <Badge variant="default">{stock} units</Badge>;
    }
  };

  return (
    <div className="px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/moderator/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Details</h1>
            <p className="text-muted-foreground">View and manage product information</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/moderator/products/${productId}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </Link>
          <ProductDeleteButton productId={productId} productName={product.name} />
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
                Product Information
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
                  <label className="text-sm font-medium text-muted-foreground">Product Code</label>
                  <p className="font-mono text-lg">{product.code}</p>
                </div>

                {product.variantCode && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Variant Code</label>
                    <p className="font-mono text-lg">{product.variantCode}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Stock</label>
                  <p className="text-lg">{product.totalStock} units</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
              </div>

              {product.verificationLink && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Verification Link</label>
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
                Warehouse Distribution
              </CardTitle>
              <CardDescription>
                Stock levels across different warehouses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.warehouses.map((warehouse, index) => (
                  <div key={warehouse.warehouseId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{warehouse.warehouseName}</h3>
                      {warehouse.country && (
                        <p className="text-sm text-muted-foreground">{warehouse.country}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {getStockBadge(warehouse.stock)}
                    </div>
                  </div>
                ))}

                {product.warehouses.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No warehouses assigned to this product
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
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="font-medium">{product.sellerName}</h3>
                <p className="text-sm text-muted-foreground">Seller ID: {product.sellerId}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{new Date(product.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{new Date(product.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Warehouses</span>
                <span className="font-medium">{product.warehouses.length}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Stock</span>
                <span className="font-medium">{product.totalStock}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-medium">{product.status}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
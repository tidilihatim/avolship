// src/app/dashboard/moderator/products/[id]/edit/page.tsx
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProductById, getAllWarehouses } from "@/app/actions/product";
import { getLoginUserRole } from "@/app/actions/auth";
import { UserRole } from "@/lib/db/models/user";
import ProductEditForm from "./product-edit-form";

export const metadata: Metadata = {
  title: "Edit Product | AvolShip Moderator",
  description: "Edit product information",
};

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModeratorProductEditPage({ params }: ProductEditPageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // Check if user has admin/moderator access
  const userRole = await getLoginUserRole();
  if (![UserRole.ADMIN, UserRole.MODERATOR].includes(userRole)) {
    redirect('/dashboard');
  }

  // Fetch product details and warehouses in parallel
  const [productResult, warehouses] = await Promise.all([
    getProductById(productId),
    getAllWarehouses()
  ]);

  if (!productResult.success || !productResult.product) {
    notFound();
  }

  return (
    <div className="px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/moderator/products/${productId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">Update product information and settings</p>
        </div>
      </div>

      {/* Edit Form */}
      <ProductEditForm
        product={productResult.product}
        warehouses={warehouses}
        productId={productId}
        redirectPath="/dashboard/moderator/products"
      />
    </div>
  );
}
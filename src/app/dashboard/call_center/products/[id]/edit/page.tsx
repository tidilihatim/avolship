// src/app/dashboard/call_center/products/[id]/edit/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProductById, getAllWarehouses } from "@/app/actions/product";
import ProductEditForm from "./product-edit-form";

export const metadata: Metadata = {
  title: "Edit Product | Call Center",
  description: "Edit product information",
};

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CallCenterProductEditPage({ params }: ProductEditPageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const t = await getTranslations("products");

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
        <Link href={`/dashboard/call_center/products/${productId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToProduct")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("editProduct")}</h1>
          <p className="text-muted-foreground">{t("updateProductInfo")}</p>
        </div>
      </div>

      {/* Edit Form */}
      <ProductEditForm
        product={productResult.product}
        warehouses={warehouses}
        productId={productId}
        redirectPath={`/dashboard/call_center/products/${productId}`}
      />
    </div>
  );
}

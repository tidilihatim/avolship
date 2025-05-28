// src/app/[locale]/dashboard/seller/products/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById } from '@/app/actions/product';
import { getLoginUserRole } from '@/app/actions/auth';
import ProductDetails from '../_components/product-detail';

export const metadata: Metadata = {
  title: 'Product Edit | AvolShip',
  description: 'Edit product details',
};

interface ProductDetailsPageProps {
  params: {
    id: string;
  };
}

/**
 * ProductDetailsPage
 * Page for viewing detailed information about a product
 */
export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const resolvedParams = await params;
  const { product, success, message } = await getProductById(resolvedParams.id);
  
  if (!success || !product) {
    notFound();
  }

  // Get current user role
  const userRole = await getLoginUserRole();
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <ProductDetails product={product} userRole={userRole} />
    </div>
  );
}
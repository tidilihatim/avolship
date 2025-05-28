import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { getAllWarehouses, getProductById } from '@/app/actions/product';
import ProductForm from '../../_components/product-form';


export const metadata: Metadata = {
  title: 'Edit Product | AvolShip',
  description: 'Edit product details',
};

interface EditProductPageProps {
  params: {
    id: string;
  };
}

/**
 * EditUserPage
 * Page for editing an existing user
 */
export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const t = await getTranslations('users');
  params = await params;
  
  const { product, success, message } = await getProductById(params.id);
  const warehouses = await getAllWarehouses();
  
  if (!success || !product) {
    notFound();
  }
  
  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/seller/products/${params.id}`} passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('editUser')}
        </h1>
      </div>
      
      <ProductForm warehouses={warehouses} isEdit product={product} />
    </div>
  );
}
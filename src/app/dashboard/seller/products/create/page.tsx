import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import ProductForm from '../_components/product-form';
import { getAllWarehouses } from '@/app/actions/product';

export const metadata: Metadata = {
  title: 'Create Product | AvolShip',
  description: 'Create a new product in the system',
};

/**
 * CreateProductPage
 * Page for creating a new product
 */
export default async function CreateProductPage() {
  const t = await getTranslations('products');
  
  // Fetch all available warehouses for the form
  const warehouses = await getAllWarehouses();
  
  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/seller/products" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('createProduct')}
        </h1>
      </div>
      
      <ProductForm warehouses={warehouses} />
    </div>
  );
}
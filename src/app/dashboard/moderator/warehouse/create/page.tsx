import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import WarehouseForm from '../_components/warehouse-form';

export const metadata: Metadata = {
  title: 'Create Warehouse | AvolShip',
  description: 'Create a new warehouse in the system',
};

/**
 * CreateWarehousePage
 * Page for creating a new warehouse
 */
export default async function page() {
  const t = await getTranslations('warehouse');
  
  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/warehouse" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('createWarehouse')}
        </h1>
      </div>
      
      <WarehouseForm />
    </div>
  );
}
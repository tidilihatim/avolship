import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import WarehouseForm from '../../_components/warehouse-form';
import { getWarehouseById } from '@/app/actions/warehouse';


export const metadata: Metadata = {
  title: 'Edit Warehouse | AvolShip',
  description: 'Edit warehouse details',
};

/**
 * EditWarehousePage
 * Page for editing an existing warehouse
 */
export default async function EditWarehousePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('warehouse');
  const {id} = await params
  const { warehouse, error } = await getWarehouseById(id);
  
  if (error || !warehouse) {
    notFound();
  }
  
  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/admin/warehouse/${id}`} passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('editWarehouse')}
        </h1>
      </div>
      
      <WarehouseForm warehouse={warehouse} isEdit />
    </div>
  );
}
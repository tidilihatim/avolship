import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Warehouse Not Found | AvolShip',
  description: 'The requested warehouse could not be found',
};

/**
 * WarehouseNotFound
 * Page displayed when a warehouse is not found
 */
export default async function WarehouseNotFound() {
  const t = await getTranslations('warehouse');
  
  return (
    <div className="container flex flex-col items-center justify-center px-4 py-16 mx-auto space-y-8 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Not Found</h1>
        <p className="text-muted-foreground">
          The warehouse you are looking for does not exist or has been removed.
        </p>
      </div>
      
      <Link href="/admin/warehouse" passHref>
        <Button className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('title')}
        </Button>
      </Link>
    </div>
  );
}
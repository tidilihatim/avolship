import { getWarehouseById } from '@/app/actions/warehouse';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import WarehouseDetails from '../_components/warehouse-details';


export const metadata: Metadata = {
  title: 'Warehouse Details | AvolShip',
  description: 'View detailed information about a warehouse',
};

interface WarehouseDetailsPageProps {
  params: {
    id: string;
  };
}

/**
 * WarehouseDetailsPage
 * Page for viewing detailed information about a warehouse
 */
export default async function WarehouseDetailsPage({
  params,
}: WarehouseDetailsPageProps) {
  const { warehouse, error } = await getWarehouseById(params.id);
  
  if (error || !warehouse) {
    notFound();
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <WarehouseDetails warehouse={warehouse} />
    </div>
  );
}
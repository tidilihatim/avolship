// src/app/[locale]/dashboard/orders/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrderById } from '@/app/actions/order';
import { getLoginUserRole } from '@/app/actions/auth';
import OrderDetails from '../_components/order-detail';

export const metadata: Metadata = {
  title: 'Order Details | AvolShip',
  description: 'View order details and information',
};

/**
 * OrderDetailsPage
 * Page for viewing detailed information about an order
 */
export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const { order, success, message } = await getOrderById(id);
  
  if (!success || !order) {
    notFound();
  }

  // Get current user role
  const userRole = await getLoginUserRole();
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <OrderDetails order={order} userRole={userRole} />
    </div>
  );
}
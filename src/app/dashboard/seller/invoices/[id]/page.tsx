import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { UserRole } from '@/app/dashboard/_constant/user';
import { getSellerDebtInvoiceById } from '@/app/actions/debt-invoice';
import SellerInvoiceDetailPage from './_components/seller-invoice-detail-page';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SellerInvoiceDetailRoute({ params }: Props) {
  // Authentication check
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  // Permission check
  if (![UserRole.SELLER].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;

  try {
    // Fetch debt-based invoice details
    const result = await getSellerDebtInvoiceById(id);
    
    if (!result.success) {
      return (
        <div className="container mx-auto p-6">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-destructive mb-4">Invoice Not Found</h2>
            <p className="text-muted-foreground">{result.message}</p>
          </div>
        </div>
      );
    }

    if (!result.data?.invoice) {
      return (
        <div className="container mx-auto p-6">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-destructive mb-4">Invoice Data Missing</h2>
            <p className="text-muted-foreground">Invoice data could not be loaded.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6">
        <SellerInvoiceDetailPage
          invoice={result.data.invoice}
          orders={result.data?.orders || []}
          expeditions={result.data?.expeditions || []}
          refundOrders={result.data?.refundOrders || []}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading invoice:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Invoice</h2>
          <p className="text-muted-foreground">An unexpected error occurred. Please try again.</p>
        </div>
      </div>
    );
  }
}
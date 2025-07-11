import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { UserRole } from '@/app/dashboard/_constant/user';
import { getInvoiceById } from '@/app/actions/invoice';
import InvoiceDetailPage from './_components/invoice-detail-page';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ViewInvoicePage({ params }: Props) {
  // Authentication check
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  // Permission check
  if (![UserRole.ADMIN, UserRole.MODERATOR].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Await params
  const { id } = await params;

  try {
    // Fetch invoice details
    const result = await getInvoiceById(id);
    
    if (!result.success) {
      return (
        <div className="container mx-auto p-6">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Invoice</h2>
            <p className="text-muted-foreground">{result.message}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6">
        <InvoiceDetailPage
          invoice={result.data?.invoice}
          orders={result.data?.orders || []}
          expeditions={result.data?.expeditions || []}
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
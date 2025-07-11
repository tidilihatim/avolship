import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { UserRole } from '@/app/dashboard/_constant/user';
import { getSellerInvoicesList } from '@/app/actions/invoice';
import SellerInvoiceList from './_components/seller-invoice-list';

interface SearchParams {
  search?: string;
  status?: string;
  page?: string;
  limit?: string;
  startDate?: string;
  endDate?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function SellerInvoicesPage({ searchParams }: Props) {
  // Authentication check
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  // Permission check
  if (![UserRole.SELLER].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Await searchParams
  const params = await searchParams;

  // Parse search parameters
  const filters = {
    search: params.search || '',
    status: params.status || '',
    startDate: params.startDate || '',
    endDate: params.endDate || '',
    page: parseInt(params.page || '1'),
    limit: parseInt(params.limit || '10'),
  };

  try {
    // Fetch seller's invoices
    const result = await getSellerInvoicesList(filters);
    
    if (!result.success) {
      return (
        <div className="container mx-auto p-6">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Invoices</h2>
            <p className="text-muted-foreground">{result.message}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6">
        <SellerInvoiceList
          invoices={result.data || []}
          pagination={result.pagination}
          filters={filters}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading seller invoices:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Invoices</h2>
          <p className="text-muted-foreground">An unexpected error occurred. Please try again.</p>
        </div>
      </div>
    );
  }
}
import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { UserRole } from '@/app/dashboard/_constant/user';
import { getInvoicesList } from '@/app/actions/invoice';
import InvoiceList from './_components/invoice-list';
import ErrorMessage from './_components/error-message';

interface SearchParams {
  search?: string;
  status?: string;
  seller?: string;
  page?: string;
  limit?: string;
  startDate?: string;
  endDate?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function InvoicesPage({ searchParams }: Props) {
  // Authentication check
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  // Permission check
  if (![UserRole.ADMIN, UserRole.MODERATOR].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Await searchParams
  const params = await searchParams;

  // Parse search parameters
  const filters = {
    search: params.search || '',
    status: params.status || '',
    seller: params.seller || '',
    startDate: params.startDate || '',
    endDate: params.endDate || '',
    page: parseInt(params.page || '1'),
    limit: parseInt(params.limit || '10'),
  };

  try {
    // Fetch invoices
    const result = await getInvoicesList(filters);
    
    if (!result.success) {
      return <ErrorMessage message={result.message} />;
    }

    return (
      <div className="container mx-auto p-6">
        <InvoiceList
          invoices={result.data || []}
          pagination={result.pagination}
          filters={filters}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading invoices:', error);
    return <ErrorMessage isUnexpected={true} />;
  }
}
import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { UserRole } from '@/app/dashboard/_constant/user';
import User from '@/lib/db/models/user';
import InvoiceGenerationPage from './_components/invoice-generation-page';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GenerateInvoicePage({ params }: Props) {
  // Authentication check
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  // Permission check
  if (![UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPPER_ADMIN].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Await params
  const { id } = await params;

  // Get seller information
  const seller: any = await User.findById(id).select('name email businessName phone country role').lean();
  
  if (!seller) {
    redirect('/dashboard/admin/users');
  }

  if (seller.role !== UserRole.SELLER) {
    redirect('/dashboard/admin/users');
  }

  // Serialize seller data
  const serializedSeller = {
    _id: seller._id.toString(),
    name: seller.name,
    email: seller.email,
    businessName: seller.businessName || null,
    phone: seller.phone || null,
    country: seller.country || null,
  };

  return (
    <InvoiceGenerationPage seller={serializedSeller} />
  );
}
import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import ContactManagementTable from '@/components/admin/contacts/contact-management-table';
import { UserRole } from '@/lib/db/models/user';
import { authOptions } from '@/config/auth';

export default async function ModeratorContactsPage() {
  // Get session and verify moderator access
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check if user has moderator or admin role
  if (session.user.role !== UserRole.MODERATOR && session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <ContactManagementTable
        userRole="moderator"
        currentUserId={session.user.id}
      />
    </div>
  );
}
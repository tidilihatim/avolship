import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import UserForm from '../../_components/user-form';
import { getUserById } from '@/app/actions/user';


export const metadata: Metadata = {
  title: 'Edit User | AvolShip',
  description: 'Edit user details',
};

interface EditUserPageProps {
  params: {
    id: string;
  };
}

/**
 * EditUserPage
 * Page for editing an existing user
 */
export default async function EditUserPage({
  params,
}: EditUserPageProps) {
  const t = await getTranslations('users');
  params = await params;
  
  const { user, success, message } = await getUserById(params.id);
  
  if (!success || !user) {
    notFound();
  }
  
  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/admin/users/${params.id}`} passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('editUser')}
        </h1>
      </div>
      
      <UserForm user={user} isEdit />
    </div>
  );
}
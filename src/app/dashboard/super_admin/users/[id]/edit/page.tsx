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


/**
 * EditUserPage
 * Page for editing an existing user
 */
export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('users');
  const {id} = await params
  
  const { user, success, message } = await getUserById(id);
  
  if (!success || !user) {
    notFound();
  }
  
  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/super_admin/users/${id}`} passHref>
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
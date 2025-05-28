import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import UserForm from '../_components/user-form';

export const metadata: Metadata = {
  title: 'Create User | AvolShip',
  description: 'Create a new user in the system',
};

/**
 * CreateUserPage
 * Page for creating a new user
 */
export default async function CreateUserPage() {
  const t = await getTranslations('users');
  
  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/users" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('createUser')}
        </h1>
      </div>
      
      <UserForm />
    </div>
  );
}
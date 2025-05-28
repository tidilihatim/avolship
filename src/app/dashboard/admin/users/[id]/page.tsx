
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import UserDetails from '../_components/user-details';
import { getUserById } from '@/app/actions/user';

export const metadata: Metadata = {
  title: 'User Details | AvolShip',
  description: 'View detailed information about a user',
};

interface UserDetailsPageProps {
  params: {
    id: string;
  };
}

/**
 * UserDetailsPage
 * Page for viewing detailed information about a user
 */
export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  params = await params
  const { user, success, message } = await getUserById(params.id);
  
  if (!success || !user) {
    notFound();
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <UserDetails user={user} />
    </div>
  );
}
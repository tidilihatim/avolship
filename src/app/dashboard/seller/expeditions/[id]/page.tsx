// src/app/[locale]/dashboard/expeditions/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getExpeditionById } from '@/app/actions/expedition';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/lib/db/models/user';
import ExpeditionDetails from '../_components/expedition-detail';

export const metadata: Metadata = {
  title: 'Expedition Details | AvolShip',
  description: 'View detailed information about an expedition',
};

interface ExpeditionDetailsPageProps {
  params: {
    id: string;
  };
}

/**
 * ExpeditionDetailsPage
 * Page for viewing detailed information about an expedition
 */
export default async function ExpeditionDetailsPage({
  params,
}: ExpeditionDetailsPageProps) {
  const resolvedParams = await params;
  const { expedition, success, message } = await getExpeditionById(resolvedParams.id);
  
  
  if (!success || !expedition) {
    notFound();
  }

  // Get current user role
  const session = await getServerSession(authOptions);
  let userRole = 'seller'; // Default role
  
  if (session?.user?.id) {
    const user = await User.findById(session.user.id);
    if (user) {
      userRole = user.role;
    }
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <ExpeditionDetails expedition={expedition} userRole={userRole} />
    </div>
  );
}
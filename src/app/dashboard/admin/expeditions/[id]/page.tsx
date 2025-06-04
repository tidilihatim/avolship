// src/app/[locale]/dashboard/expeditions/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getExpeditionById } from '@/app/actions/expedition';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import User from '@/lib/db/models/user';
import ExpeditionDetails from '@/app/dashboard/seller/expeditions/_components/expedition-detail';

export const metadata: Metadata = {
  title: 'Expedition Details | AvolShip',
  description: 'View detailed information about an expedition',
};


/**
 * ExpeditionDetailsPage
 * Page for viewing detailed information about an expedition
 */
export default async function ExpeditionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {

  const {id} = await params
  const { expedition, success, message } = await getExpeditionById(id);
  
  
  if (!success || !expedition) {
    notFound();
  }

  // Get current user role
  const session = await getServerSession(authOptions);
  let userRole = 'admin'; // Default role
  
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
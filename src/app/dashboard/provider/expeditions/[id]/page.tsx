import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/config/auth";
import { getProviderExpeditionById } from "@/app/actions/expedition";
import { UserRole } from "@/app/dashboard/_constant/user";
import User from "@/lib/db/models/user";
import ExpeditionDetails from "../../../seller/expeditions/_components/expedition-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Expedition Details | AvolShip",
  description: "View expedition details and manage status",
};

export default async function ProviderExpeditionDetailPage({ params }: Props) {
  const { id } = await params;
  
  // Get current user session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    notFound();
  }

  const user = await User.findById(session.user.id);
  if (!user || user.role !== UserRole.PROVIDER) {
    notFound();
  }

  // Fetch expedition details
  const { expedition, success, message } = await getProviderExpeditionById(id);

  if (!success || !expedition) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <ExpeditionDetails 
        expedition={expedition} 
        userRole={user.role}
        warehouseCurrency={expedition.warehouse?.currency}
      />
    </div>
  );
}
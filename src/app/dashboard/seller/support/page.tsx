import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getMyTickets } from "@/app/actions/ticket-actions";
import { CreateTicketButton } from "@/components/support/create-ticket-button";
import { MyTicketList } from "@/components/support/my-ticket-list";
import { authOptions } from "@/config/auth";
import { UserRole } from "@/lib/db/models/user";
import { getLoginUserRole } from "@/app/actions/auth";

export default async function SellerSupport() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = await getLoginUserRole()

  if (role !== UserRole.SELLER) {
    redirect("/dashboard");
  }

  const tickets = await getMyTickets();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Center</h1>
          <p className="text-muted-foreground">
            Get help with your account, orders, and technical issues
          </p>
        </div>
        <CreateTicketButton />
      </div>

      <div className="grid gap-6">
        <MyTicketList tickets={tickets} />
      </div>
    </div>
  );
}
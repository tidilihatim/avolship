import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAllTickets } from "@/app/actions/ticket-actions";
import { TicketList } from "@/components/support/ticket-list";
import { TicketStats } from "@/components/support/ticket-stats";
import { authOptions } from "@/config/auth";
import { getLoginUserRole } from "@/app/actions/auth";
import { UserRole } from "../_constant/user";

export default async function SupportDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = await getLoginUserRole()

  if (role!==UserRole.SUPPORT) {
    redirect("/dashboard");
  }

  const tickets = await getAllTickets();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and respond to customer support tickets
          </p>
        </div>
      </div>

      <TicketStats tickets={tickets} />
      <TicketList tickets={tickets} />
    </div>
  );
}
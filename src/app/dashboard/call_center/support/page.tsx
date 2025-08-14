import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getMyTickets } from "@/app/actions/ticket-actions";
import { CreateTicketButton } from "@/components/support/create-ticket-button";
import { MyTicketList } from "@/components/support/my-ticket-list";
import { authOptions } from "@/config/auth";

export default async function CallCenterSupport() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user as any;
  if (user.role !== "CALL_CENTER") {
    redirect("/dashboard");
  }

  const tickets = await getMyTickets();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Center Support</h1>
          <p className="text-muted-foreground">
            Report technical issues and get assistance with call center operations
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
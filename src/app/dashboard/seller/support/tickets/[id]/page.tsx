import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getMyTickets } from "@/app/actions/ticket-actions";
import { TicketDetail } from "@/components/support/ticket-detail";
import { TicketChat } from "@/components/support/ticket-chat";
import { authOptions } from "@/config/auth";
import { UserRole } from "@/lib/db/models/user";
import { getLoginUserRole } from "@/app/actions/auth";

interface TicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Mock function to get single ticket - replace with your API call
async function getTicket(id: string) {
  const tickets = await getMyTickets();
  return tickets.find((t: any) => t._id === id) || null;
}

// Mock function to get ticket messages - replace with your API call
async function getTicketMessages(id: string) {
  // This should call your API to get messages for this ticket
  return [];
}

export default async function SellerTicketPage({ params }: TicketPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = await getLoginUserRole();

  if (role !== UserRole.SELLER) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const ticket = await getTicket(id);
  
  if (!ticket) {
    redirect("/dashboard/seller/support");
  }

  const messages = await getTicketMessages(id);
  const currentUser = session.user as any;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Support Ticket Details</h1>
        <nav className="text-sm text-muted-foreground">
          <a href="/dashboard/seller/support" className="hover:text-primary">Support</a>
          {" / "}
          <span>Ticket #{ticket._id.slice(-6)}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TicketDetail ticket={ticket} currentUser={currentUser} />
        </div>
        <div className="lg:col-span-1">
          <TicketChat 
            ticket={ticket} 
            messages={messages}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}
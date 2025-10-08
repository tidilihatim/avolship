import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getMyTickets } from "@/app/actions/ticket-actions";
import { CreateTicketButton } from "@/components/support/create-ticket-button";
import { MyTicketList } from "@/components/support/my-ticket-list";
import { authOptions } from "@/config/auth";
import { UserRole } from "../../_constant/user";

export default async function CallCenterSupport() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user as any;
  if (user.role !== UserRole.CALL_CENTER) {
    redirect("/dashboard");
  }

  const tickets = await getMyTickets();
  const t = await getTranslations("callCenterSupport");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
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
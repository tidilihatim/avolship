import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import DashboardLayout from "./_components/dashboard-layout";
import { ThemeProvider } from "./_components/theme-provider";
import { getLoginUserRole } from "../actions/auth";
import { WarehouseProvider } from "@/context/warehouse";
import { getActiveWarehouses } from "../actions/warehouse";
import { cookies } from "next/headers";
import { SocketProvider } from "@/lib/socket/socket-provider";
import { deleteCookie } from "../actions/cookie";
import { Toaster } from "@/components/ui/sonner";
import ThemeAwareTopLoader from "@/components/ui/loader";

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export const metadata = {
  title: "Dashboard | AvolShip",
};

export default async function SellerDashboardLayout({
  children,
  params: { locale },
}: Props) {
  const currentLoginUserRole = await getLoginUserRole();
  if (!currentLoginUserRole) notFound();

  const { warehouses = [], error } = await getActiveWarehouses();
  const selectedWarehouseId = (await cookies()).get("selectedWarehouse")?.value;

  return (
    <ThemeProvider
      attribute={"class"}
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
    >
      <NextIntlClientProvider>
        <SocketProvider>
          <WarehouseProvider selectedWarehouseId={selectedWarehouseId} initialWarehouses={warehouses}>
            <DashboardLayout userType={currentLoginUserRole}>
              {children}
            </DashboardLayout>
          </WarehouseProvider>
        </SocketProvider>
        <ThemeAwareTopLoader />
        <Toaster  />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

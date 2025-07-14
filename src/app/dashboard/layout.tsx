import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
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
import { NotificationProvider } from "./_components/notification-provider";

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
  if (!currentLoginUserRole) {
    // Redirect to login page instead of showing not found
    redirect('/auth/login');
  }

  const { warehouses = [], error } = await getActiveWarehouses();
  const selectedWarehouseId = (await cookies()).get("selectedWarehouse")?.value;

  // Map database roles to dashboard layout user types
  const roleMapping: Record<string, string> = {
    'ADMIN': 'admin',
    'admin': 'admin',
    'SELLER': 'seller',
    'seller': 'seller',
    'PROVIDER': 'provider',
    'provider': 'provider',
    'SUPPORT': 'support',
    'support': 'support',
    'CALL_CENTER': 'call_center',
    'call_center': 'call_center',
    'DELIVERY': 'delivery',
    'delivery': 'delivery'
  };

  const mappedUserType = roleMapping[currentLoginUserRole] || currentLoginUserRole.toLowerCase();

  return (
    <ThemeProvider
      attribute={"class"}
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
    >
      <NextIntlClientProvider>
        <SocketProvider>
          <NotificationProvider>
            <WarehouseProvider selectedWarehouseId={selectedWarehouseId} initialWarehouses={warehouses}>
              <DashboardLayout userType={mappedUserType as any}>
                {children}
              </DashboardLayout>
            </WarehouseProvider>
          </NotificationProvider>
        </SocketProvider>
        <ThemeAwareTopLoader />
        <Toaster  />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

// src/app/[locale]/dashboard/seller/orders/create/page.tsx
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/db/models/user";
import OrderForm from "../_components/order-form";
import { getCurrentUser } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Create Order | AvolShip",
  description: "Create a new order for customer delivery",
};

/**
 * Order Create Page
 * Provides a form for creating new orders
 */
export default async function OrderCreatePage() {
  const t = await getTranslations("orders");
  
  // Get current user and validate access
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Only sellers and admins can create orders
  if (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("createOrder")}
          </h1>
          <p className="text-muted-foreground">
            {t("createOrderDescription")}
          </p>
        </div>
      </div>

      <OrderForm
        isEdit={false}
        currentUser={{
          _id: user._id,
          role: user.role,
        }}
      />
    </div>
  );
}
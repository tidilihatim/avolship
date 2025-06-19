// src/app/[locale]/dashboard/expeditions/create/page.tsx
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAllWarehousesForExpedition, getAllProvidersForExpedition } from "@/app/actions/expedition";
import ExpeditionForm from "../_components/expedition-form";
import { getCurrentUser } from "@/app/actions/auth";
import { getCountryNames } from "@/constants/countries";

export const metadata: Metadata = {
  title: "Create Expedition | AvolShip",
  description: "Create a new expedition for product delivery",
};

/**
 * Expedition Create Page
 * Provides a form for creating new expeditions
 */
export default async function ExpeditionCreatePage() {
  const t = await getTranslations("expeditions");
  const user = await getCurrentUser();

  // Fetch all necessary data for the form
  const [warehouses, providers] = await Promise.all([
    getAllWarehousesForExpedition(),
    getAllProvidersForExpedition(),
  ]);

  // Get countries from constants
  const countries = getCountryNames();

  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("createExpedition")}
          </h1>
          <p className="text-muted-foreground">
            {t("createExpeditionDescription")}
          </p>
        </div>
      </div>

      <ExpeditionForm
        userRole={user?.role}
        warehouses={warehouses}
        providers={providers}
        countries={countries}
        isEdit={false}
      />
    </div>
  );
}
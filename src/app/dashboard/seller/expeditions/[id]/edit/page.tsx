import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getAllWarehouses } from "@/app/actions/product";
import {
  getAllProvidersForExpedition,
  getAllWarehousesForExpedition,
  getCountriesForForm,
  getExpeditionById,
} from "@/app/actions/expedition";
import ExpeditionForm from "../../_components/expedition-form";
import { getCurrentUser } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Edit Expedition | AvolShip",
  description: "Edit Expedition details",
};


/**
 * EditUserPage
 * Page for editing an existing user
 */
export default async function EditExpeditionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations("expeditions");
  const {id} = await params

  const { expedition, success } = await getExpeditionById(id);
  const user = await getCurrentUser();

  const [warehouses, providers, countries] = await Promise.all([
    getAllWarehousesForExpedition(),
    getAllProvidersForExpedition(),
    getCountriesForForm(),
  ]);

  if (!success || !expedition) {
    notFound();
  }

  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/seller/expeditions`} passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("editExpedition")}
        </h1>
      </div>

      <ExpeditionForm
        warehouses={warehouses}
        providers={providers}
        countries={countries}
        isEdit
        expedition={expedition}
        userRole={user?.role}
      />
    </div>
  );
}

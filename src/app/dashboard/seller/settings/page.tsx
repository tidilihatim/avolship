import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SettingsLayout from "./_components/settings-layout";

export const metadata: Metadata = {
  title: "Settings | AvolShip",
  description: "Manage your seller settings and preferences",
};

export default async function SellerSettingsPage() {
  const t = await getTranslations("settings");

  return (
    <div className="container px-4 py-8 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </div>

      <SettingsLayout />
    </div>
  );
}
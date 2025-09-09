import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import UserSettingsLayout from "@/components/shared/user-settings-layout";

export const metadata: Metadata = {
  title: "Settings | AvolShip",
  description: "Manage your provider settings and preferences",
};

export default async function ProviderSettingsPage() {
  const t = await getTranslations("settings");

  return (
    <div className="px-4 py-8 space-y-6">
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

      <UserSettingsLayout userType="provider" />
    </div>
  );
}
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CreateTicketDialog } from "./create-ticket-dialog";
import { Plus } from "lucide-react";

export function CreateTicketButton() {
  const t = useTranslations("callCenterSupport");

  return (
    <CreateTicketDialog
      trigger={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("createTicket")}
        </Button>
      }
    />
  );
}
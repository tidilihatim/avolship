"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateTicketDialog } from "./create-ticket-dialog";
import { Plus } from "lucide-react";

export function CreateTicketButton() {
  return (
    <CreateTicketDialog
      trigger={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      }
    />
  );
}
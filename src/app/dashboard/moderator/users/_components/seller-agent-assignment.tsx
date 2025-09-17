"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { assignSellerToAgent } from "@/app/actions/user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX } from "lucide-react";

interface CallCenterAgent {
  _id: string;
  name: string;
  email: string;
}

interface SellerAgentAssignmentProps {
  sellerId: string;
  currentAgent?: {
    _id: string;
    name: string;
    email: string;
  };
  agents: CallCenterAgent[];
}

export default function SellerAgentAssignment({
  sellerId,
  currentAgent,
  agents
}: SellerAgentAssignmentProps) {
  const t = useTranslations("users.assignment");
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    currentAgent?._id || "no-assignment"
  );
  const [isPending, startTransition] = useTransition();

  const handleAssignment = () => {
    startTransition(async () => {
      try {
        const agentId = selectedAgentId === "no-assignment" ? null : selectedAgentId;
        const result = await assignSellerToAgent(sellerId, agentId);
        
        if (result.success) {
          toast.success(t("assignmentSuccess"));
        } else {
          toast.error(result.message || t("assignmentError"));
        }
      } catch (error) {
        toast.error(t("assignmentError"));
      }
    });
  };

  const hasChanges = selectedAgentId !== (currentAgent?._id || "no-assignment");

  return (
    <div className="space-y-2">
        <Select
          value={selectedAgentId}
          onValueChange={setSelectedAgentId}
          disabled={isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("selectAgent")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-assignment">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <span>{t("noAssignment")}</span>
              </div>
            </SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent._id} value={agent._id}>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {agent.email}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentAgent && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("currentlyAssigned")}</span>
            <Badge variant="secondary" className="text-xs">
              {currentAgent.name}
            </Badge>
          </div>
        )}

        {hasChanges && (
          <Button
            onClick={handleAssignment}
            disabled={isPending}
            size="sm"
            className="w-full"
          >
            {isPending ? t("updating") : t("updateAssignment")}
          </Button>
        )}
    </div>
  );
}
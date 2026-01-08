"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { assignSellerToAgent } from "@/app/actions/user";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";

interface CallCenterAgent {
  _id: string;
  name: string;
  email: string;
}

interface AssignedAgentConfig {
  _id: string;
  name: string;
  email: string;
  maxPendingOrders?: number;
}

interface SellerAgentAssignmentProps {
  sellerId: string;
  currentAgent?: {
    _id: string;
    name: string;
    email: string;
  };
  currentAgents?: AssignedAgentConfig[];
  agents: CallCenterAgent[];
}

export default function SellerAgentAssignment({
  sellerId,
  currentAgent,
  currentAgents,
  agents
}: SellerAgentAssignmentProps) {
  const t = useTranslations("users.assignment");

  // Build initial agent configs from currentAgents or currentAgent
  const initialConfigs = currentAgents && currentAgents.length > 0
    ? currentAgents.map(a => ({ agentId: a._id, maxPendingOrders: a.maxPendingOrders || 10 }))
    : currentAgent
      ? [{ agentId: currentAgent._id, maxPendingOrders: 10 }]
      : [];

  const [agentConfigs, setAgentConfigs] = useState<Array<{ agentId: string; maxPendingOrders: number }>>(
    initialConfigs
  );
  const [isPending, startTransition] = useTransition();

  // Get selected agent IDs for the MultiSelect
  const selectedAgentIds = agentConfigs.map(config => config.agentId);

  // Handle agent selection changes
  const handleAgentSelectionChange = (newSelectedIds: string[]) => {
    // Add new agents with default maxPendingOrders
    const newConfigs = newSelectedIds.map(agentId => {
      const existing = agentConfigs.find(c => c.agentId === agentId);
      return existing || { agentId, maxPendingOrders: 10 };
    });
    setAgentConfigs(newConfigs);
  };

  // Handle maxPendingOrders change for a specific agent
  const handleMaxPendingOrdersChange = (agentId: string, value: number) => {
    setAgentConfigs(configs =>
      configs.map(config =>
        config.agentId === agentId ? { ...config, maxPendingOrders: value } : config
      )
    );
  };

  const handleAssignment = () => {
    startTransition(async () => {
      try {
        const result = await assignSellerToAgent(sellerId, agentConfigs);

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

  // Check if there are changes
  const hasChanges = JSON.stringify(agentConfigs.sort((a, b) => a.agentId.localeCompare(b.agentId))) !==
                     JSON.stringify(initialConfigs.sort((a, b) => a.agentId.localeCompare(b.agentId)));

  const displayAgents: AssignedAgentConfig[] = currentAgents && currentAgents.length > 0
    ? currentAgents
    : (currentAgent ? [{ ...currentAgent, maxPendingOrders: undefined }] : []);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t("assignAgents")}
        </label>
        <MultiSelect
          options={agents.map(agent => ({
            value: agent._id,
            label: `${agent.name} (${agent.email})`
          }))}
          selected={selectedAgentIds}
          onChange={handleAgentSelectionChange}
          placeholder={t("selectAgents")}
        />
      </div>

      {/* Max pending orders configuration for each selected agent */}
      {agentConfigs.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">{t("configureAgents")}:</span>
          {agentConfigs.map((config) => {
            const agent = agents.find(a => a._id === config.agentId);
            if (!agent) return null;

            return (
              <div key={config.agentId} className="flex items-center gap-2 p-2 border rounded-md">
                <div className="flex-1">
                  <div className="text-sm font-medium">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">{agent.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">
                    {t("maxPendingOrders")}:
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={config.maxPendingOrders}
                    onChange={(e) => handleMaxPendingOrdersChange(config.agentId, parseInt(e.target.value) || 1)}
                    className="w-20 h-8 text-sm"
                  />
                </div>
              </div>
            );
          })}
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
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderTableData } from "./order-table-types";

interface CallCenterAgent {
  _id: string;
  name: string;
  email: string;
}

interface OrderAssignmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderTableData | null;
  callCenterAgents: CallCenterAgent[];
  selectedAgent: string;
  onSelectedAgentChange: (value: string) => void;
  isAssigning: boolean;
  onAssign: () => void;
}

export default function OrderAssignmentDialog({
  isOpen,
  onOpenChange,
  order,
  callCenterAgents,
  selectedAgent,
  onSelectedAgentChange,
  isAssigning,
  onAssign,
}: OrderAssignmentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Order to Agent</DialogTitle>
          <DialogDescription>
            Select a call center agent to assign order {order?.orderId} to.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="agent-select" className="text-sm font-medium">
              Select Call Center Agent
            </label>
            <Select value={selectedAgent} onValueChange={onSelectedAgentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent>
                {callCenterAgents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.name} ({agent.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={onAssign}
            disabled={isAssigning || !selectedAgent}
          >
            {isAssigning ? "Assigning..." : "Assign Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
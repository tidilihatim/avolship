"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  Phone,
  PhoneCall,
  History,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatus } from "@/lib/db/models/order";
import { UserRole } from "@/lib/db/models/user";
import { addCallAttempt } from "@/app/actions/call-center";
import { updateOrderStatus } from "@/app/actions/order";

interface OrderProduct {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
}

interface CallAttempt {
  attemptNumber: number;
  phoneNumber: string;
  attemptDate: Date;
  status: "answered" | "unreached" | "busy" | "invalid";
  notes?: string;
  callCenterAgent?: {
    name: string;
    role: string;
  };
}

interface DoubleOrderReference {
  orderId: string;
  customerName: string;
  orderDate: Date;
  similarity: {
    sameName: boolean;
    samePhone: boolean;
    sameProduct: boolean;
    orderDateDifference: number;
  };
}

interface OrderTableData {
  _id: string;
  orderId: string;
  customer: {
    name: string;
    phoneNumbers: string[];
    shippingAddress: string;
  };
  warehouseId: string;
  warehouseName: string;
  warehouseCountry: string;
  sellerId: string;
  sellerName: string;
  products: OrderProduct[];
  totalPrice: number;
  status: OrderStatus;
  statusComment?: string;
  statusChangedBy?: {
    name: string;
    role: string;
  };
  statusChangedAt: Date;
  callAttempts: CallAttempt[];
  totalCallAttempts: number;
  lastCallAttempt?: Date;
  lastCallStatus?: "answered" | "unreached" | "busy" | "invalid";
  isDouble: boolean;
  doubleOrderReferences: DoubleOrderReference[];
  orderDate: Date;
  priority?: "urgent" | "high" | "normal";
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CallCenterActionsProps {
  order: OrderTableData;
  userRole: string | null;
}

interface CallDialog {
  isOpen: boolean;
  selectedPhone: string;
  callStatus: "answered" | "unreached" | "busy" | "invalid" | "";
  notes: string;
  orderStatus?: OrderStatus;
}

export function CallCenterActions({ order, userRole }: CallCenterActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [callDialog, setCallDialog] = useState<CallDialog>({
    isOpen: false,
    selectedPhone: "",
    callStatus: "",
    notes: "",
  });

  const isCallCenterAgent = userRole === UserRole.CALL_CENTER;
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
  const canMakeCalls = isCallCenterAgent || isAdminOrModerator;

  const handleMakeCall = (phoneNumber?: string) => {
    const phone = phoneNumber || order.customer.phoneNumbers[0];
    setCallDialog({
      isOpen: true,
      selectedPhone: phone,
      callStatus: "",
      notes: "",
    });
  };

  const handleCallComplete = async () => {
    if (!callDialog.callStatus) {
      toast.error("Please select call status");
      return;
    }

    setIsLoading(true);
    try {
      // Record the call attempt
      const callResult = await addCallAttempt(
        order._id,
        callDialog.selectedPhone,
        callDialog.callStatus,
        callDialog.notes
      );

      if (!callResult.success) {
        toast.error(callResult.message || "Failed to record call attempt");
        return;
      }

      // If call was answered and order status should be updated
      if (callDialog.callStatus === "answered" && callDialog.orderStatus) {
        const statusResult = await updateOrderStatus(
          order._id,
          callDialog.orderStatus,
          callDialog.notes
        );

        if (!statusResult.success) {
          toast.error(statusResult.message || "Failed to update order status");
          return;
        }
      }

      toast.success("Call attempt recorded successfully");
      setCallDialog({
        isOpen: false,
        selectedPhone: "",
        callStatus: "",
        notes: "",
      });

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error recording call attempt:", error);
      toast.error("Failed to record call attempt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickStatus = async (status: OrderStatus, comment?: string) => {
    setIsLoading(true);
    try {
      const result = await updateOrderStatus(order._id, status, comment);

      if (!result.success) {
        toast.error(result.message || "Failed to update order status");
        return;
      }

      toast.success("Order status updated successfully");
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!isAdminOrModerator) {
      toast.error("Only admins and moderators can assign agents");
      return;
    }
    
    try {
      // This would open a dialog to select an agent
      // For now, we'll show a placeholder toast
      toast.info("Agent assignment dialog would open here - feature ready for implementation");
    } catch (error) {
      console.error("Error assigning agent:", error);
      toast.error("Failed to assign agent");
    }
  };

  const getQuickActions = () => {
    const actions = [];

    // Primary call action
    if (canMakeCalls) {
      actions.push(
        <Button
          key="primary-call"
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleMakeCall()}
          disabled={isLoading}
        >
          <PhoneCall className="h-4 w-4 mr-1" />
          {t("callCenter.calls.makeCall")}
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Actions */}
      {getQuickActions()}

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>

          {/* View Order */}
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/${userRole}/orders/${order._id}`}>
              <Eye className="mr-2 h-4 w-4" />
              {t("common.view")} Order
            </Link>
          </DropdownMenuItem>

          {/* Call History */}
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/${userRole}/orders/${order._id}#history`}>
              <History className="mr-2 h-4 w-4" />
              {t("orders.callHistory.title")}
            </Link>
          </DropdownMenuItem>

          {/* Double Orders */}
          {order.isDouble && order.doubleOrderReferences.length > 0 && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/${userRole}/orders/${order._id}#double`}>
                <Users className="mr-2 h-4 w-4" />
                {t("orders.viewDoubleOrders")}
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Call Center Specific Actions */}
          {canMakeCalls && (
            <>
              {/* Alternative Phone Numbers */}
              {order.customer.phoneNumbers.length > 1 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Call Alternative Numbers
                  </DropdownMenuLabel>
                  {order.customer.phoneNumbers.slice(1).map((phone, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => handleMakeCall(phone)}
                      className="cursor-pointer"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      {phone}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Quick Status Updates */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Quick Status Update
              </DropdownMenuLabel>
              
              <DropdownMenuItem
                onClick={() => handleQuickStatus(OrderStatus.CONFIRMED, "Confirmed via call center")}
                className="cursor-pointer text-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("callCenter.calls.confirmed")}
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => handleQuickStatus(OrderStatus.UNREACHED, "Customer unreachable")}
                className="cursor-pointer text-gray-600"
              >
                <Clock className="mr-2 h-4 w-4" />
                {t("callCenter.calls.noAnswer")}
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => handleQuickStatus(OrderStatus.WRONG_NUMBER, "Phone number is incorrect")}
                className="cursor-pointer text-orange-600"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {t("callCenter.calls.wrongNumber")}
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => handleQuickStatus(OrderStatus.CANCELLED, "Customer declined order")}
                className="cursor-pointer text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t("callCenter.calls.declined")}
              </DropdownMenuItem>
            </>
          )}

          {/* Admin/Moderator Actions */}
          {isAdminOrModerator && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleAssignAgent}
                className="cursor-pointer"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Assign to Agent
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Call Dialog */}
      <Dialog open={callDialog.isOpen} onOpenChange={(open) => setCallDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("callCenter.calls.makeCall")}</DialogTitle>
            <DialogDescription>
              Record call attempt for order {order.orderId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Customer: {order.customer.name}</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="font-mono">{callDialog.selectedPhone}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${callDialog.selectedPhone}`)}
                >
                  Call Now
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callStatus">{t("callCenter.calls.callStatus")}</Label>
              <Select
                value={callDialog.callStatus}
                onValueChange={(value) => setCallDialog(prev => ({ 
                  ...prev, 
                  callStatus: value as "answered" | "unreached" | "busy" | "invalid"
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select call result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="answered">{t("orders.callStatuses.answered")}</SelectItem>
                  <SelectItem value="unreached">{t("orders.callStatuses.unreached")}</SelectItem>
                  <SelectItem value="busy">{t("orders.callStatuses.busy")}</SelectItem>
                  <SelectItem value="invalid">{t("orders.callStatuses.invalid")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {callDialog.callStatus === "answered" && (
              <div className="space-y-2">
                <Label htmlFor="orderStatus">Order Status</Label>
                <Select
                  value={callDialog.orderStatus}
                  onValueChange={(value) => setCallDialog(prev => ({ 
                    ...prev, 
                    orderStatus: value as OrderStatus
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Update order status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrderStatus.CONFIRMED}>{t("orders.statuses.confirmed")}</SelectItem>
                    <SelectItem value={OrderStatus.CANCELLED}>{t("orders.statuses.cancelled")}</SelectItem>
                    <SelectItem value={OrderStatus.WRONG_NUMBER}>{t("orders.statuses.wrong_number")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t("callCenter.calls.callNotes")}</Label>
              <Textarea
                id="notes"
                placeholder="Add call notes..."
                value={callDialog.notes}
                onChange={(e) => setCallDialog(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCallDialog(prev => ({ ...prev, isOpen: false }))}
              disabled={isLoading}
            >
              {t("orders.common.cancel")}
            </Button>
            <Button 
              onClick={handleCallComplete}
              disabled={isLoading}
            >
              {isLoading ? "Recording..." : "Record Call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Globe,
  Phone,
  MapPin,
  Package,
  Users,
  PhoneCall,
  User,
  Copy,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OrderStatus } from "@/lib/db/models/order";

import { CallCenterActions } from "./call-center-actions";

interface OrderProduct {
  productId: string;
  name: string;
  code: string;
  description: string;
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

interface WarehouseOption {
  _id: string;
  name: string;
  country: string;
  currency: string;
}

interface CallCenterOrderTableViewProps {
  orders: OrderTableData[];
  allWarehouses: WarehouseOption[];
  userRole: string | null;
  isAdminOrModerator: boolean;
}

export function CallCenterOrderTableView({
  orders,
  allWarehouses,
  userRole,
  isAdminOrModerator,
}: CallCenterOrderTableViewProps) {
  const t = useTranslations();

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.PENDING]: {
        label: t("orders.statuses.pending"),
        className: "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200",
      },
      [OrderStatus.CONFIRMED]: {
        label: t("orders.statuses.confirmed"),
        className: "bg-green-50 text-green-700 hover:bg-green-50 border-green-200",
      },
      [OrderStatus.CANCELLED]: {
        label: t("orders.statuses.cancelled"),
        className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200",
      },
      [OrderStatus.WRONG_NUMBER]: {
        label: t("orders.statuses.wrong_number"),
        className: "bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-200",
      },
      [OrderStatus.DOUBLE]: {
        label: t("orders.statuses.double"),
        className: "bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200",
      },
      [OrderStatus.UNREACHED]: {
        label: t("orders.statuses.unreached"),
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      },
      [OrderStatus.EXPIRED]: {
        label: t("orders.statuses.expired"),
        className: "bg-slate-50 text-slate-700 hover:bg-slate-50 border-slate-200",
      },
    };

    return statusConfig[status] || {
      label: "Unknown",
      className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
    };
  };

  const getCallStatusBadge = (status: "answered" | "unreached" | "busy" | "invalid") => {
    const statusConfig = {
      answered: {
        label: t("orders.callStatuses.answered"),
        className: "bg-green-50 text-green-700 hover:bg-green-50 border-green-200",
      },
      unreached: {
        label: t("orders.callStatuses.unreached"),
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      },
      busy: {
        label: t("orders.callStatuses.busy"),
        className: "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200",
      },
      invalid: {
        label: t("orders.callStatuses.invalid"),
        className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200",
      },
    };

    return statusConfig[status];
  };

  const getPriorityBadge = (priority?: "urgent" | "high" | "normal") => {
    if (!priority) return null;

    const priorityConfig = {
      urgent: {
        label: t("callCenter.priority.urgent"),
        className: "bg-red-50 text-red-700 border-red-200",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      },
      high: {
        label: t("callCenter.priority.high"),
        className: "bg-orange-50 text-orange-700 border-orange-200",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      },
      normal: {
        label: t("callCenter.priority.normal"),
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <Clock className="h-3 w-3 mr-1" />,
      },
    };

    const config = priorityConfig[priority];
    return (
      <Badge variant="outline" className={config.className}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: number, warehouseId?: string) => {
    const warehouse = allWarehouses.find((w) => w._id === warehouseId);
    const currency = warehouse?.currency || "USD";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("messages.copiedToClipboard"));
    } catch (error) {
      toast.error(t("messages.failedToCopy"));
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-center">
          {t("callCenter.messages.noOrdersInQueue")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("orders.fields.orderId")}</TableHead>
            <TableHead>{t("orders.fields.customer")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("orders.fields.warehouse")}</TableHead>
            {isAdminOrModerator && (
              <TableHead className="hidden lg:table-cell">{t("orders.fields.seller")}</TableHead>
            )}
            <TableHead className="hidden xl:table-cell">{t("orders.fields.products")}</TableHead>
            <TableHead>{t("orders.fields.totalPrice")}</TableHead>
            <TableHead>{t("orders.fields.status")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("orders.fields.orderDate")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("orders.fields.callAttempts")}</TableHead>
            <TableHead className="text-center">{t("callCenter.actions.call")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id} className={order.priority === "urgent" ? "bg-red-50/50" : order.priority === "high" ? "bg-orange-50/50" : ""}>
              <TableCell className="font-medium">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      {order.orderId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(order.orderId)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {order.isDouble && (
                    <Badge
                      variant="outline"
                      className="w-fit bg-purple-50 text-purple-700 border-purple-200"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {t("orders.badges.doubleOrder")}
                    </Badge>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto w-full p-2 justify-start"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">
                            {order.customer.name}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {order.customer.phoneNumbers.length} phone
                            {order.customer.phoneNumbers.length > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="px-2 pb-2 overflow-hidden transition-all duration-500 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <div className="space-y-2 bg-muted/50 p-3 rounded-md border max-h-64 overflow-y-auto">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                          <Phone className="h-3 w-3" />
                          Phone Numbers
                        </div>
                        <div className="space-y-1">
                          {order.customer.phoneNumbers.map((phone, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-background p-2 rounded border"
                            >
                              <span className="font-mono text-sm">{phone}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(phone);
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-green-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`tel:${phone}`);
                                  }}
                                >
                                  <Phone className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          Shipping Address
                        </div>
                        <div className="bg-background p-3 rounded border">
                          <p className="text-sm leading-relaxed">
                            {order.customer.shippingAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <div className="space-y-1">
                  <div className="font-medium text-sm">{order.warehouseName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {order.warehouseCountry}
                  </div>
                </div>
              </TableCell>

              {isAdminOrModerator && (
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{order.sellerName}</span>
                  </div>
                </TableCell>
              )}

              <TableCell className="hidden xl:table-cell">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto w-full p-2 justify-start"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {order.products.length}{" "}
                            {order.products.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="px-2 pb-2 overflow-hidden transition-all duration-500 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <div className="space-y-2 bg-muted/50 p-3 rounded-md border max-h-64 overflow-y-auto">
                      {order.products.map((product, index) => (
                        <div key={index} className="bg-background p-3 rounded border">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm leading-tight">
                                {product.name?.slice(0, 50) +
                                  (product.name?.length > 50 ? "..." : "")}
                              </h4>
                              <Badge variant="secondary" className="text-xs ml-2">
                                #{index + 1}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="space-y-1">
                                <div className="text-muted-foreground">Product Code</div>
                                <div className="font-mono bg-muted px-2 py-1 rounded">
                                  {product.code}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Qty:</span>
                                  <span className="font-medium ml-1">{product.quantity}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Unit Price:</span>
                                  <span className="font-medium ml-1">
                                    {formatPrice(product.unitPrice, order.warehouseId)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Subtotal</div>
                                <div className="font-semibold">
                                  {formatPrice(product.unitPrice * product.quantity, order.warehouseId)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="bg-primary/10 border-primary/20 p-3 rounded border-2 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Order Total</span>
                          <span className="font-bold text-lg">
                            {formatPrice(order.totalPrice, order.warehouseId)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </TableCell>

              <TableCell className="font-semibold text-lg">
                {formatPrice(order.totalPrice, order.warehouseId)}
              </TableCell>

              <TableCell>
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className={getStatusBadge(order.status).className}
                  >
                    {getStatusBadge(order.status).label}
                  </Badge>
                  {order.statusComment && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded border max-w-[150px]">
                      <div className="font-medium mb-1">Comment:</div>
                      <div className="leading-tight overflow-hidden">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help truncate max-w-full">
                                {order.statusComment.length > 30
                                  ? `${order.statusComment.substring(0, 30)}...`
                                  : order.statusComment}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="whitespace-pre-wrap break-words">
                                {order.statusComment}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )}
                </div>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <div className="text-sm">
                  <div className="font-medium">
                    {formatDate(order.orderDate)}
                  </div>
                  {getPriorityBadge(order.priority)}
                </div>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {order.totalCallAttempts} attempts
                    </span>
                  </div>
                  {order.totalCallAttempts > 0 && (
                    <div className="space-y-1">
                      {order.lastCallStatus && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            getCallStatusBadge(order.lastCallStatus)?.className
                          }`}
                        >
                          {getCallStatusBadge(order.lastCallStatus)?.label}
                        </Badge>
                      )}
                      {order.lastCallAttempt && (
                        <div className="text-xs text-muted-foreground">
                          Last: {formatDate(order.lastCallAttempt)}
                        </div>
                      )}
                    </div>
                  )}
                  {order.totalCallAttempts === 0 && (
                    <div className="text-xs text-muted-foreground italic">
                      No calls made
                    </div>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-center">
                <CallCenterActions order={order} userRole={userRole} actionType="call" />
              </TableCell>

              <TableCell className="text-right">
                <CallCenterActions order={order} userRole={userRole} actionType="actions" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
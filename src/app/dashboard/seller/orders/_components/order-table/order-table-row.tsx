"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Globe,
  Phone,
  MapPin,
  Package,
  Users,
  Calendar,
  PhoneCall,
  User,
  Copy,
  MoreHorizontal,
  Eye,
  History,
  Percent,
  Tag,
  Truck,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { OrderStatus } from "@/lib/db/models/order";
import { UserRole } from "@/lib/db/models/user";
import { OrderTableData, WarehouseOption } from "./order-table-types";
import { ColumnVisibility } from "./column-toggle";
import { MakeCallButton } from "@/components/call-center/make-call-button";

interface OrderTableRowProps {
  order: OrderTableData;
  allWarehouses: WarehouseOption[];
  isAdminOrModerator: boolean;
  userRole: string | null;
  onStatusUpdate: (order: OrderTableData) => void;
  onAssignOrder: (order: OrderTableData) => void;
  onAssignRider?: (order: OrderTableData) => void;
  onEditCustomer?: (order: OrderTableData) => void;
  onApplyDiscount?: (order: OrderTableData) => void;
  columnVisibility: ColumnVisibility;
}

export default function OrderTableRow({
  order,
  allWarehouses,
  isAdminOrModerator,
  userRole,
  onStatusUpdate,
  onAssignOrder,
  onAssignRider,
  onEditCustomer,
  onApplyDiscount,
  columnVisibility,
}: OrderTableRowProps) {
  const t = useTranslations();
  const router = useRouter();

  const handleCallComplete = (callData: {
    phoneNumber: string
    status: 'answered' | 'unreached' | 'busy' | 'invalid'
    notes?: string
  }) => {
    toast.success(`Call completed - Status: ${callData.status}`)
    router.refresh()
  };
  
  // Get status badge styling
  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.PENDING]: {
        label: t("orders.statuses.pending"),
        className:
          "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200",
      },
      [OrderStatus.CONFIRMED]: {
        label: t("orders.statuses.confirmed"),
        className:
          "bg-green-50 text-green-700 hover:bg-green-50 border-green-200",
      },
      [OrderStatus.SHIPPED]: {
        label: t("orders.statuses.shipped"),
        className:
          "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200",
      },
      [OrderStatus.ASSIGNED_TO_DELIVERY]: {
        label: "Assigned to Delivery",
        className:
          "bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200",
      },
      [OrderStatus.ACCEPTED_BY_DELIVERY]: {
        label: "Accepted by Delivery",
        className:
          "bg-teal-50 text-teal-700 hover:bg-teal-50 border-teal-200",
      },
      [OrderStatus.IN_TRANSIT]: {
        label: "In Transit",
        className:
          "bg-cyan-50 text-cyan-700 hover:bg-cyan-50 border-cyan-200",
      },
      [OrderStatus.OUT_FOR_DELIVERY]: {
        label: "Out for Delivery",
        className:
          "bg-sky-50 text-sky-700 hover:bg-sky-50 border-sky-200",
      },
      [OrderStatus.DELIVERED]: {
        label: t("orders.statuses.delivered"),
        className:
          "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200",
      },
      [OrderStatus.DELIVERY_FAILED]: {
        label: "Delivery Failed",
        className:
          "bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200",
      },
      [OrderStatus.REFUNDED]: {
        label: t("orders.statuses.refunded"),
        className:
          "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200",
      },
      [OrderStatus.CANCELLED]: {
        label: t("orders.statuses.cancelled"),
        className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200",
      },
      [OrderStatus.WRONG_NUMBER]: {
        label: t("orders.statuses.wrong_number"),
        className:
          "bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-200",
      },
      [OrderStatus.DOUBLE]: {
        label: t("orders.statuses.double"),
        className:
          "bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200",
      },
      [OrderStatus.UNREACHED]: {
        label: t("orders.statuses.unreached"),
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      },
      [OrderStatus.EXPIRED]: {
        label: t("orders.statuses.expired"),
        className:
          "bg-slate-50 text-slate-700 hover:bg-slate-50 border-slate-200",
      },
    };

    return (
      statusConfig[status] || {
        label: "Unknown",
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      }
    );
  };

  // Get call status badge
  const getCallStatusBadge = (
    status: "answered" | "unreached" | "busy" | "invalid"
  ) => {
    const statusConfig = {
      answered: {
        label: t("orders.callStatuses.answered"),
        className:
          "bg-green-50 text-green-700 hover:bg-green-50 border-green-200",
      },
      unreached: {
        label: t("orders.callStatuses.unreached"),
        className: "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200",
      },
      busy: {
        label: t("orders.callStatuses.busy"),
        className:
          "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200",
      },
      invalid: {
        label: t("orders.callStatuses.invalid"),
        className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200",
      },
    };

    return statusConfig[status];
  };

  // Format price with currency based on warehouse
  const formatPrice = (price: number, warehouseId?: string) => {
    // Find warehouse to get currency
    const warehouse = allWarehouses.find((w) => w._id === warehouseId);
    const currency = warehouse?.currency || "USD";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("messages.copiedToClipboard"));
    } catch (error) {
      toast.error(t("messages.failedToCopy"));
    }
  };

  // Check if order has discounts
  const hasDiscounts = order.priceAdjustments && order.priceAdjustments.length > 0;
  const totalDiscountAmount = order.totalDiscountAmount || 0;
  const finalTotalPrice = order.finalTotalPrice || order.totalPrice;
  const originalTotalPrice = hasDiscounts ? order.totalPrice + totalDiscountAmount : order.totalPrice;

  // Calculate discount percentage for display
  const discountPercentage = hasDiscounts && originalTotalPrice > 0 
    ? ((totalDiscountAmount / originalTotalPrice) * 100) 
    : 0;

  // Get product discount info
  const getProductDiscountInfo = (productId: string) => {
    if (!hasDiscounts) return null;
    const adjustment = order.priceAdjustments?.find(adj => adj.productId === productId);
    return adjustment;
  };

  return (
    <TableRow>
      {columnVisibility.orderId && (
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
          {hasDiscounts && (
            <Badge
              variant="outline"
              className="w-fit bg-green-50 text-green-700 border-green-200"
            >
              <Percent className="h-3 w-3 mr-1" />
              {discountPercentage.toFixed(1)}% off
            </Badge>
          )}
        </div>
        </TableCell>
      )}

      {columnVisibility.customer && (
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
      )}

      {columnVisibility.warehouse && (
        <TableCell className="table-cell">
        <div className="space-y-1">
          <div className="font-medium text-sm">{order.warehouseName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {order.warehouseCountry}
          </div>
        </div>
        </TableCell>
      )}

      {isAdminOrModerator && columnVisibility.seller && (
        <TableCell className="table-cell">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{order.sellerName}</span>
          </div>
        </TableCell>
      )}

      {isAdminOrModerator && columnVisibility.assignedAgent && (
        <TableCell className="table-cell">
          <div className="flex items-center gap-2">
            {order.assignedAgent ? (
              <>
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {order.assignedAgent}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">Unassigned</span>
            )}
          </div>
        </TableCell>
      )}

      {columnVisibility.assignedRider && (
        <TableCell className="table-cell">
          <div className="flex items-center gap-2">
            {order.assignedRider ? (
              <>
                <Truck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {order.assignedRider.name}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">Unassigned</span>
            )}
          </div>
        </TableCell>
      )}

      {columnVisibility.products && (
        <TableCell className="table-cell">
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
                  {hasDiscounts ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs line-through text-muted-foreground">
                        {formatPrice(originalTotalPrice, order.warehouseId)}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        {formatPrice(finalTotalPrice, order.warehouseId)}
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {formatPrice(order.totalPrice, order.warehouseId)}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="px-6 pb-6 overflow-hidden transition-all duration-500 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="space-y-5 bg-muted/30 p-6 rounded-lg border max-h-96 overflow-y-auto w-full">
              {order.products.map((product, index) => {
                
                const discountInfo = getProductDiscountInfo(product.productId);
                const hasProductDiscount = discountInfo !== null;
                
                return (
                  <div
                    key={index}
                    className="bg-background p-6 rounded-lg border shadow-sm w-full"
                  >
                    <div className="space-y-4 w-full">
                      {/* Header with product name and badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-base leading-tight truncate" title={product.productName}>
                            {product.productName}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Code: <span className="font-mono">{product.productCode}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasProductDiscount && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 whitespace-nowrap">
                              <Tag className="h-3 w-3 mr-1" />
                              -{((discountInfo!.discountAmount / discountInfo!.originalPrice) * 100).toFixed(1)}%
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs whitespace-nowrap">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>

                      {/* Discount reason section - separate row for better readability */}
                      {hasProductDiscount && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Percent className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-medium text-green-800">Discount Applied</span>
                          </div>
                          <p className="text-sm text-green-700 break-words">
                            <span className="font-medium">Reason:</span> {discountInfo!.reason}
                          </p>
                          {discountInfo!.notes && (
                            <p className="text-xs text-green-600 mt-1 break-words">
                              <span className="font-medium">Notes:</span> {discountInfo!.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Price and quantity section - full width layout */}
                      <div className="pt-4 border-t w-full">
                        <div className="flex flex-wrap items-start gap-6 w-full">
                          <div className="flex-1 min-w-[120px]">
                            <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                            <div className="font-semibold text-xl">{product.quantity}</div>
                          </div>
                          
                          <div className="flex-1 min-w-[150px]">
                            <div className="text-xs text-muted-foreground mb-1">Unit Price</div>
                            {hasProductDiscount ? (
                              <div className="space-y-1">
                                <div className="line-through text-muted-foreground text-base">
                                  {formatPrice(discountInfo!.originalPrice, order.warehouseId)}
                                </div>
                                <div className="font-semibold text-xl text-green-700">
                                  {formatPrice(product.unitPrice, order.warehouseId)}
                                </div>
                              </div>
                            ) : (
                              <div className="font-semibold text-xl">
                                {formatPrice(product.unitPrice, order.warehouseId)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-[150px] text-right">
                            <div className="text-xs text-muted-foreground mb-1">Subtotal</div>
                            <div className="font-bold text-2xl text-primary break-words">
                              {formatPrice(
                                product.unitPrice * product.quantity,
                                order.warehouseId
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8 w-full">
                {hasDiscounts ? (
                  <div className="space-y-4 w-full">
                    <div className="text-center">
                      <h5 className="font-medium text-lg mb-4 flex items-center justify-center gap-2">
                        <Percent className="h-5 w-5" />
                        Order Summary with Discounts
                      </h5>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 text-center">
                      <div className="flex-1 min-w-[150px]">
                        <div className="text-sm  mb-2">Original Total</div>
                        <div className="line-through  text-xl">
                          {formatPrice(originalTotalPrice, order.warehouseId)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <div className="text-sm  mb-2">Total Savings</div>
                        <div className="text-green-700 font-semibold text-xl">
                          -{formatPrice(totalDiscountAmount, order.warehouseId)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <div className="text-sm  mb-2">Final Total</div>
                        <div className="font-bold text-3xl text-green-700 break-words">
                          {formatPrice(finalTotalPrice, order.warehouseId)}
                        </div>
                      </div>
                    </div>
                    <div className="text-center pt-3 border-t">
                      <div className="text-sm ">
                        You saved {((totalDiscountAmount / originalTotalPrice) * 100).toFixed(1)}% on this order
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center w-full">
                    <div className="text-sm mb-3">Order Total</div>
                    <div className="font-bold text-3xl text-primary break-words">
                      {formatPrice(order.totalPrice, order.warehouseId)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        </TableCell>
      )}

      {columnVisibility.totalPrice && (
        <TableCell className="font-semibold text-lg">
        {hasDiscounts ? (
          <div className="space-y-1">
            <div className="line-through text-muted-foreground text-sm">
              {formatPrice(originalTotalPrice, order.warehouseId)}
            </div>
            <div className="text-green-700">
              {formatPrice(finalTotalPrice, order.warehouseId)}
            </div>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              -{formatPrice(totalDiscountAmount, order.warehouseId)}
            </Badge>
          </div>
        ) : (
          <div>{formatPrice(order.totalPrice, order.warehouseId)}</div>
        )}
        </TableCell>
      )}

      {columnVisibility.status && (
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
      )}

      {columnVisibility.callAttempts && (
        <TableCell className="table-cell">
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
      )}

      {columnVisibility.orderDate && (
        <TableCell className="table-cell">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{formatDate(order.orderDate)}</div>
          </div>
        </div>
        </TableCell>
      )}

      {columnVisibility.actions && (
        <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>

            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href={`/dashboard/${userRole}/orders/${order._id}`}>
                <Eye className="mr-2 h-4 w-4" />
                {t("common.view")}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link
                href={`/dashboard/${userRole}/orders/${order._id}#history`}
              >
                <History className="mr-2 h-4 w-4" />
                {t("orders.statusHistory.title")}
              </Link>
            </DropdownMenuItem>

            {order.isDouble && order.doubleOrderReferences.length > 0 && (
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link
                  href={`/dashboard/${userRole}/orders/${order._id}#double`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t("orders.viewDoubleOrders")}
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Call Center Actions */}
            {(userRole === UserRole.CALL_CENTER || isAdminOrModerator) && (
              <>
                <div className="px-2 py-1.5">
                  <MakeCallButton
                    orderId={order._id}
                    customerName={order.customer.name}
                    phoneNumbers={order.customer.phoneNumbers}
                    onCallComplete={handleCallComplete}
                    size="sm"
                    className="w-full"
                  />
                </div>

                <DropdownMenuItem className="cursor-pointer">
                  <Phone className="mr-2 h-4 w-4" />
                  View Call History
                </DropdownMenuItem>
              </>
            )}

            {/* Admin/Moderator Actions */}
            {isAdminOrModerator && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => onStatusUpdate(order)}
                >
                  {t("orders.actions.updateStatus")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => onAssignOrder(order)}
                >
                  {t("orders.actions.assignToAgent")}
                </DropdownMenuItem>
                {onAssignRider && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onAssignRider(order)}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Assign Rider
                  </DropdownMenuItem>
                )}
                {onEditCustomer && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onEditCustomer(order)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Customer
                  </DropdownMenuItem>
                )}
              </>
            )}

            {/* Call Center Actions */}
            {userRole === UserRole.CALL_CENTER && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => onStatusUpdate(order)}
                >
                  {t("orders.actions.updateStatus")}
                </DropdownMenuItem>
                {onAssignRider && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onAssignRider(order)}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Assign Rider
                  </DropdownMenuItem>
                )}
                {onEditCustomer && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onEditCustomer(order)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Customer
                  </DropdownMenuItem>
                )}
                {onApplyDiscount && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onApplyDiscount(order)}
                  >
                    <Percent className="mr-2 h-4 w-4" />
                    Apply Discount
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  );
}
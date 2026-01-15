// src/components/call-center/EnhancedOrderCard.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  Phone, 
  MapPin, 
  Package, 
  User, 
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PhoneCall,
  MessageSquare,
  MoreVertical,
  History,
  Truck,
  Package2,
  Home,
  RefreshCw
} from 'lucide-react';
import { OrderItem } from '@/types/socket';
import { formatDistanceToNow } from 'date-fns';
import { cn, formatPrice } from '@/lib/utils';
import { MakeCallButton } from '@/components/call-center/make-call-button';
import { Checkbox } from '@/components/ui/checkbox';

// Order Status enum - Complete list from order model
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  SHIPPED = 'shipped',
  ASSIGNED_TO_DELIVERY = 'assigned_to_delivery',
  ACCEPTED_BY_DELIVERY = 'accepted_by_delivery',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  DELIVERY_FAILED = 'delivery_failed',
  REFUNDED = 'refunded',
  WRONG_NUMBER = 'wrong_number',
  DOUBLE = 'double',
  UNREACHED = 'unreached',
  EXPIRED = 'expired',
}

// Call Status enum
export enum CallStatus {
  ANSWERED = 'answered',
  UNREACHED = 'unreached',
  BUSY = 'busy',
  INVALID = 'invalid',
}

// Call Attempt interface
export interface CallAttempt {
  phoneNumber: string;
  status: CallStatus;
  notes?: string;
  attemptDate?: Date;
}

// Enhanced Order Card Component
function EnhancedOrderCard({ 
  order, 
  type = 'assigned',
  onRequestAssignment,
  onCompleteOrder,
  onUpdateOrderStatus,
  onMakeCallAttempt,
  currentAgentId,
  t
}: {
  order: OrderItem;
  type?: 'assigned' | 'available';
  onRequestAssignment?: (orderId: string) => void;
  onCompleteOrder?: (orderId: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus, comment?: string, shouldUpdateStock?: boolean) => void;
  onMakeCallAttempt?: (orderId: string, attempt: CallAttempt) => void;
  currentAgentId?: string;
  t: any;
}) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(OrderStatus.CONFIRMED);
  const [statusComment, setStatusComment] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [updateStock, setUpdateStock] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Update current time every minute for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute (60,000ms)

    return () => clearInterval(interval);
  }, []);

  // Check if seller is assigned to current agent
  const isSellerAssignedToMe = order.seller?.assignedCallCenterAgent === currentAgentId;
  
  // Calculate remaining time in minutes
  const getRemainingTime = () => {
    if (!order.lockExpiry) return null;
    
    const remainingMs = new Date(order.lockExpiry).getTime() - currentTime;
    const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
    
    if (remainingMinutes <= 0) return t('callCenter.queue.time.expired');
    if (remainingMinutes < 60) return `${remainingMinutes}m`;
    
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  // Only show timing warnings for orders from sellers who are NOT assigned to this agent
  const isExpiringSoon = order.lockExpiry && 
    new Date(order.lockExpiry).getTime() - currentTime < 10 * 60 * 1000 && // 10 minutes
    !isSellerAssignedToMe; // Don't show warnings for assigned sellers

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CONFIRMED: return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      case OrderStatus.SHIPPED: return 'bg-blue-100 text-blue-800';
      case OrderStatus.ASSIGNED_TO_DELIVERY: return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.ACCEPTED_BY_DELIVERY: return 'bg-cyan-100 text-cyan-800';
      case OrderStatus.IN_TRANSIT: return 'bg-purple-100 text-purple-800';
      case OrderStatus.OUT_FOR_DELIVERY: return 'bg-amber-100 text-amber-800';
      case OrderStatus.DELIVERED: return 'bg-emerald-100 text-emerald-800';
      case OrderStatus.DELIVERY_FAILED: return 'bg-red-100 text-red-800';
      case OrderStatus.REFUNDED: return 'bg-orange-100 text-orange-800';
      case OrderStatus.WRONG_NUMBER: return 'bg-orange-100 text-orange-800';
      case OrderStatus.DOUBLE: return 'bg-purple-100 text-purple-800';
      case OrderStatus.UNREACHED: return 'bg-gray-100 text-gray-800';
      case OrderStatus.EXPIRED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING: return <Clock className="w-4 h-4" />;
      case OrderStatus.CONFIRMED: return <CheckCircle className="w-4 h-4" />;
      case OrderStatus.CANCELLED: return <XCircle className="w-4 h-4" />;
      case OrderStatus.SHIPPED: return <Package className="w-4 h-4" />;
      case OrderStatus.ASSIGNED_TO_DELIVERY: return <User className="w-4 h-4" />;
      case OrderStatus.ACCEPTED_BY_DELIVERY: return <CheckCircle className="w-4 h-4" />;
      case OrderStatus.IN_TRANSIT: return <Truck className="w-4 h-4" />;
      case OrderStatus.OUT_FOR_DELIVERY: return <Package2 className="w-4 h-4" />;
      case OrderStatus.DELIVERED: return <Home className="w-4 h-4" />;
      case OrderStatus.DELIVERY_FAILED: return <XCircle className="w-4 h-4" />;
      case OrderStatus.REFUNDED: return <RefreshCw className="w-4 h-4" />;
      case OrderStatus.WRONG_NUMBER: return <AlertTriangle className="w-4 h-4" />;
      case OrderStatus.DOUBLE: return <AlertTriangle className="w-4 h-4" />;
      case OrderStatus.UNREACHED: return <Phone className="w-4 h-4" />;
      case OrderStatus.EXPIRED: return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Helper function to determine if status requires stock increase
  const shouldIncreaseStock = (status: OrderStatus): boolean => {
    return [
      OrderStatus.DELIVERY_FAILED,
      OrderStatus.REFUNDED,
      OrderStatus.UNREACHED,
      OrderStatus.CANCELLED
    ].includes(status);
  };


  const handleStatusUpdate = async () => {
    if (!onUpdateOrderStatus) return;
    
    setIsUpdatingStatus(true);
    
    try {
      // Update order status with stock movement control
      onUpdateOrderStatus(order.orderId, selectedStatus, statusComment.trim() || undefined, updateStock);
      
      // Reset form
      setStatusComment('');
      setUpdateStock(false);
      setIsStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      // Still close dialog and reset form even on error
      setStatusComment('');
      setUpdateStock(false);
      setIsStatusDialogOpen(false);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      type === 'assigned' && isExpiringSoon && "border-orange-300",
      isSellerAssignedToMe && "border-primary border-2 bg-primary/5"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {order.orderNumber}
            </Badge>
            <Badge variant={type === 'assigned' ? 'default' : 'secondary'}>
              {type === 'assigned' 
                ? t('callCenter.queue.badges.assigned') 
                : t('callCenter.queue.badges.available')
              }
            </Badge>
            {isSellerAssignedToMe && (
              <Badge variant="default" className="bg-primary text-primary-foreground">
                {t('callCenter.queue.priority')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {order.lockExpiry && type === 'assigned' && !isSellerAssignedToMe && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{getRemainingTime()}</span>
              </div>
            )}
            
            {type === 'assigned' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('callCenter.queue.actions.label')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <div className="px-2 py-1.5">
                    <MakeCallButton
                      orderId={order.orderId}
                      customerName={order.customer.name}
                      phoneNumbers={order.customer.phoneNumbers}
                      onCallComplete={(callData) => {
                        if (onMakeCallAttempt) {
                          const attempt: CallAttempt = {
                            phoneNumber: callData.phoneNumber,
                            status: callData.status as CallStatus,
                            notes: callData.notes,
                            attemptDate: new Date()
                          };
                          onMakeCallAttempt(order.orderId, attempt);
                        }

                        // Auto-update order status based on call result
                        if (callData.status === 'answered' && onUpdateOrderStatus) {
                          onUpdateOrderStatus(order.orderId, OrderStatus.CONFIRMED, t('callCenter.queue.callStatus.confirmedViaCall'));
                        } else if (callData.status === 'invalid' && onUpdateOrderStatus) {
                          onUpdateOrderStatus(order.orderId, OrderStatus.WRONG_NUMBER, t('callCenter.queue.callStatus.invalidNumber'));
                        }
                      }}
                      size="sm"
                      className="w-full"
                      t={t}
                    />
                  </div>
                  
                  <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {t('callCenter.queue.actions.updateStatus')}
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </Dialog>
                  
                  <DropdownMenuSeparator />
                  
                  {onCompleteOrder && (
                    <DropdownMenuItem onClick={() => onCompleteOrder(order.orderId)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('callCenter.queue.actions.completeOrder')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{order.customer.name}</span>
          </div>
          
          {/* Seller Info */}
          {order.seller && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('callCenter.queue.seller.label')}</span>
                <span className="text-sm font-medium">{order.seller.name}</span>
                {order.seller.businessName && (
                  <span className="text-xs text-muted-foreground">({order.seller.businessName})</span>
                )}
                {isSellerAssignedToMe && (
                  <Badge variant="secondary" className="text-xs">
                    {t('callCenter.queue.seller.assignedToYou')}
                  </Badge>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {order.customer.phoneNumbers.map((phone, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs"
                >
                  {phone}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="text-sm text-muted-foreground">
              {order.customer.shippingAddress}
            </span>
          </div>
        </div>

        <Separator />

        {/* Order Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatPrice(order.totalPrice, order.warehouse?.currency || 'USD')}</span>
            </div>
            <div className="flex items-center gap-1">
              {getStatusIcon(order.status)}
              <Badge className={getStatusColor(order.status)}>
                {t(`callCenter.queue.badges.${order.status.toLowerCase()}`)}
              </Badge>
            </div>
          </div>
          
          {order.products && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {order.products.length} {order.products.length !== 1 
                  ? t('callCenter.queue.order.items') 
                  : t('callCenter.queue.order.item')
                }
              </span>
            </div>
          )}

          {order.warehouse && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{order.warehouse.name} - {order.warehouse.country}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          {type === 'available' && onRequestAssignment && (
            <Button 
              onClick={() => onRequestAssignment(order.orderId)}
              className="flex-1"
              size="sm"
            >
              {t('callCenter.queue.actions.requestAssignment')}
            </Button>
          )}
          
          {type === 'assigned' && (
            <>
              <MakeCallButton
                orderId={order.orderId}
                customerName={order.customer.name}
                phoneNumbers={order.customer.phoneNumbers}
                onCallComplete={(callData) => {
                  // Handle call completion - refresh queue and auto-update status if needed
                  if (onMakeCallAttempt) {
                    const attempt: CallAttempt = {
                      phoneNumber: callData.phoneNumber,
                      status: callData.status as CallStatus,
                      notes: callData.notes,
                      attemptDate: new Date()
                    };
                    onMakeCallAttempt(order.orderId, attempt);
                  }

                  // Auto-update order status based on call result
                  if (callData.status === 'answered' && onUpdateOrderStatus) {
                    onUpdateOrderStatus(order.orderId, OrderStatus.CONFIRMED, t('callCenter.queue.callStatus.confirmedViaCall'));
                  } else if (callData.status === 'invalid' && onUpdateOrderStatus) {
                    onUpdateOrderStatus(order.orderId, OrderStatus.WRONG_NUMBER, t('callCenter.queue.callStatus.invalidNumber'));
                  }
                }}
                className="flex-1"
                size="sm"
                t={t}
              />
              
              <Button
                onClick={() => setIsStatusDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('callCenter.queue.actions.update')}
              </Button>
            </>
          )}
        </div>
      </CardContent>


      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('callCenter.queue.statusDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('callCenter.queue.statusDialog.description')} {order.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="orderStatus">{t('callCenter.queue.statusDialog.newStatus')}</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as OrderStatus)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={t('callCenter.queue.statusDialog.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OrderStatus.PENDING}>{t('callCenter.queue.badges.pending')}</SelectItem>
                  <SelectItem value={OrderStatus.CONFIRMED}>{t('callCenter.queue.badges.confirmed')}</SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED}>{t('callCenter.queue.badges.cancelled')}</SelectItem>
                  <SelectItem value={OrderStatus.SHIPPED}>{t('callCenter.queue.badges.shipped')}</SelectItem>
                  <SelectItem value={OrderStatus.ASSIGNED_TO_DELIVERY}>{t('callCenter.queue.badges.assigned_to_delivery')}</SelectItem>
                  <SelectItem value={OrderStatus.ACCEPTED_BY_DELIVERY}>{t('callCenter.queue.badges.accepted_by_delivery')}</SelectItem>
                  <SelectItem value={OrderStatus.IN_TRANSIT}>{t('callCenter.queue.badges.in_transit')}</SelectItem>
                  <SelectItem value={OrderStatus.OUT_FOR_DELIVERY}>{t('callCenter.queue.badges.out_for_delivery')}</SelectItem>
                  <SelectItem value={OrderStatus.DELIVERED}>{t('callCenter.queue.badges.delivered')}</SelectItem>
                  <SelectItem value={OrderStatus.DELIVERY_FAILED}>{t('callCenter.queue.badges.delivery_failed')}</SelectItem>
                  <SelectItem value={OrderStatus.REFUNDED}>{t('callCenter.queue.badges.refunded')}</SelectItem>
                  <SelectItem value={OrderStatus.WRONG_NUMBER}>{t('callCenter.queue.badges.wrong_number')}</SelectItem>
                  <SelectItem value={OrderStatus.DOUBLE}>{t('callCenter.queue.badges.double')}</SelectItem>
                  <SelectItem value={OrderStatus.UNREACHED}>{t('callCenter.queue.badges.unreached')}</SelectItem>
                  <SelectItem value={OrderStatus.EXPIRED}>{t('callCenter.queue.badges.expired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Stock Update Checkbox - Only show for statuses that affect stock */}
            {shouldIncreaseStock(selectedStatus) && (
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="updateStock"
                  checked={updateStock}
                  onCheckedChange={(checked) => setUpdateStock(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="updateStock"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t('callCenter.queue.statusDialog.updateStock')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('callCenter.queue.statusDialog.updateStockDescription')}
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="statusComment">{t('callCenter.queue.statusDialog.reasonLabel')}</Label>
              <Textarea
                id="statusComment"
                placeholder={t('callCenter.queue.statusDialog.reasonPlaceholder')}
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isUpdatingStatus}
            >
              {t('callCenter.queue.statusDialog.cancel')}
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? t('callCenter.queue.statusDialog.updating') : t('callCenter.queue.statusDialog.updateButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default EnhancedOrderCard;
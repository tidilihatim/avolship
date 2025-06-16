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
  DollarSign, 
  User, 
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PhoneCall,
  MessageSquare,
  MoreVertical,
  History
} from 'lucide-react';
import { OrderItem } from '@/types/socket';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Order Status enum
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
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
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus, comment?: string) => void;
  onMakeCallAttempt?: (orderId: string, attempt: CallAttempt) => void;
  currentAgentId?: string;
  t: any;
}) {
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.ANSWERED);
  const [callNotes, setCallNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(OrderStatus.CONFIRMED);
  const [statusComment, setStatusComment] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

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
    
    if (remainingMinutes <= 0) return "Expired";
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
      case OrderStatus.CONFIRMED: return <CheckCircle className="w-4 h-4" />;
      case OrderStatus.CANCELLED: return <XCircle className="w-4 h-4" />;
      case OrderStatus.WRONG_NUMBER: return <AlertTriangle className="w-4 h-4" />;
      case OrderStatus.DOUBLE: return <AlertTriangle className="w-4 h-4" />;
      case OrderStatus.UNREACHED: return <Phone className="w-4 h-4" />;
      case OrderStatus.EXPIRED: return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleCallAttempt = () => {
    if (!selectedPhone || !onMakeCallAttempt) return;

    const attempt: CallAttempt = {
      phoneNumber: selectedPhone,
      status: callStatus,
      notes: callNotes.trim() || undefined,
      attemptDate: new Date()
    };

    onMakeCallAttempt(order.orderId, attempt);
    
    // Reset form
    setCallNotes('');
    setIsCallDialogOpen(false);
    
    // Auto-update order status based on call result
    if (callStatus === CallStatus.ANSWERED && onUpdateOrderStatus) {
      onUpdateOrderStatus(order.orderId, OrderStatus.CONFIRMED, 'Customer confirmed via call');
    } else if (callStatus === CallStatus.INVALID && onUpdateOrderStatus) {
      onUpdateOrderStatus(order.orderId, OrderStatus.WRONG_NUMBER, 'Invalid phone number');
    }
  };

  const handleStatusUpdate = () => {
    if (!onUpdateOrderStatus) return;
    
    onUpdateOrderStatus(order.orderId, selectedStatus, statusComment.trim() || undefined);
    
    // Reset form
    setStatusComment('');
    setIsStatusDialogOpen(false);
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
                Priority
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
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <PhoneCall className="w-4 h-4 mr-2" />
                        Make Call
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </Dialog>
                  
                  <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Update Status
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </Dialog>
                  
                  <DropdownMenuSeparator />
                  
                  {onCompleteOrder && (
                    <DropdownMenuItem onClick={() => onCompleteOrder(order.orderId)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Order
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
                <span className="text-sm text-muted-foreground">Seller:</span>
                <span className="text-sm font-medium">{order.seller.name}</span>
                {order.seller.businessName && (
                  <span className="text-xs text-muted-foreground">({order.seller.businessName})</span>
                )}
                {isSellerAssignedToMe && (
                  <Badge variant="secondary" className="text-xs">
                    Assigned to you
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
                  className="text-xs cursor-pointer hover:bg-blue-50"
                  onClick={() => {
                    setSelectedPhone(phone);
                    setIsCallDialogOpen(true);
                  }}
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
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">${order.totalPrice.toFixed(2)}</span>
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
              <Button
                onClick={() => {
                  setSelectedPhone(order.customer.phoneNumbers[0] || '');
                  setIsCallDialogOpen(true);
                }}
                className="flex-1"
                size="sm"
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                Call Customer
              </Button>
              
              <Button
                onClick={() => setIsStatusDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Update
              </Button>
            </>
          )}
        </div>
      </CardContent>

      {/* Call Dialog */}
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Make Call Attempt</DialogTitle>
          <DialogDescription>
            Record the result of your call to {order.customer.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Select value={selectedPhone} onValueChange={setSelectedPhone}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select phone number" />
              </SelectTrigger>
              <SelectContent>
                {order.customer.phoneNumbers.map((phone, index) => (
                  <SelectItem key={index} value={phone}>{phone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="callStatus">Call Result</Label>
            <Select value={callStatus} onValueChange={(value) => setCallStatus(value as CallStatus)}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select call result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CallStatus.ANSWERED}>Answered</SelectItem>
                <SelectItem value={CallStatus.UNREACHED}>Unreached</SelectItem>
                <SelectItem value={CallStatus.BUSY}>Busy</SelectItem>
                <SelectItem value={CallStatus.INVALID}>Invalid Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="callNotes">Notes (Optional)</Label>
            <Textarea
              id="callNotes"
              placeholder="Add any notes about the call..."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCallDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCallAttempt}>
            Record Call
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of order {order.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="orderStatus">New Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as OrderStatus)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OrderStatus.CONFIRMED}>Confirmed</SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                  <SelectItem value={OrderStatus.WRONG_NUMBER}>Wrong Number</SelectItem>
                  <SelectItem value={OrderStatus.DOUBLE}>Double Order</SelectItem>
                  <SelectItem value={OrderStatus.UNREACHED}>Unreached</SelectItem>
                  <SelectItem value={OrderStatus.EXPIRED}>Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="statusComment">Reason/Comment (Optional)</Label>
              <Textarea
                id="statusComment"
                placeholder="Add reason for status change..."
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default EnhancedOrderCard;
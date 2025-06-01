'use client';

// src/app/[locale]/dashboard/orders/[id]/_components/order-details.tsx
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  DollarSign, 
  Hash, 
  Eye, 
  History, 
  AlertTriangle, 
  PhoneCall, 
  Clock, 
  Users, 
  MessageSquare, 
  Copy,
  CheckCircle,
  XCircle,
  Clock3,
  Globe,
  Activity,
  ArrowRight,
  Timer,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { OrderStatus } from '@/lib/db/models/order';
import { UserRole } from '@/lib/db/models/user';

interface OrderDetailsProps {
  order: any;
  userRole?: string;
}

/**
 * OrderDetails Component
 * Displays detailed information about an order with responsive design and full localization
 */
export default function OrderDetails({ order, userRole }: OrderDetailsProps) {
  const t = useTranslations('orders');
  const router = useRouter();

  // Check if user is admin or moderator
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
  const isCallCenter = userRole === UserRole.CALL_CENTER;
  
  // Get status configuration
  const getStatusConfig = (status: OrderStatus) => {
    const statusConfigs = {
      [OrderStatus.PENDING]: { 
        label: t('statuses.pending'), 
        description: t('statusDescriptions.pending'),
        className: 'border-muted-foreground bg-muted/10',
        icon: Clock3
      },
      [OrderStatus.CONFIRMED]: { 
        label: t('statuses.confirmed'), 
        description: t('statusDescriptions.confirmed'),
        className: 'border-primary bg-primary/10',
        icon: CheckCircle
      },
      [OrderStatus.CANCELLED]: { 
        label: t('statuses.cancelled'), 
        description: t('statusDescriptions.cancelled'),
        className: 'border-destructive bg-destructive/10',
        icon: XCircle
      },
      [OrderStatus.WRONG_NUMBER]: { 
        label: t('statuses.wrong_number'), 
        description: t('statusDescriptions.wrong_number'),
        className: 'border-orange-500 bg-orange-500/10',
        icon: Phone
      },
      [OrderStatus.DOUBLE]: { 
        label: t('statuses.double'), 
        description: t('statusDescriptions.double'),
        className: 'border-purple-500 bg-purple-500/10',
        icon: Users
      },
      [OrderStatus.UNREACHED]: { 
        label: t('statuses.unreached'), 
        description: t('statusDescriptions.unreached'),
        className: 'border-muted-foreground bg-muted/10',
        icon: PhoneCall
      },
      [OrderStatus.EXPIRED]: { 
        label: t('statuses.expired'), 
        description: t('statusDescriptions.expired'),
        className: 'border-muted bg-muted/10',
        icon: AlertTriangle
      }
    };
    return statusConfigs[status] || { 
      label: t('misc.unknown'), 
      description: t('misc.unknown'),
      className: 'border-muted bg-muted/10',
      icon: AlertTriangle
    };
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  // Get call status configuration
  const getCallStatusConfig = (status: string) => {
    const configs = {
      answered: { label: t('callStatuses.answered'), className: 'border-primary bg-primary/10', icon: CheckCircle },
      unreached: { label: t('callStatuses.unreached'), className: 'border-muted-foreground bg-muted/10', icon: Phone },
      busy: { label: t('callStatuses.busy'), className: 'border-muted-foreground bg-muted/10', icon: Clock3 },
      invalid: { label: t('callStatuses.invalid'), className: 'border-destructive bg-destructive/10', icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs.unreached;
  };

  // Format price with currency based on warehouse
  const formatPrice = (price: number, warehouseId?: string) => {
    // Get currency from order's warehouse data
    const currency = order.warehouseCurrency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  // Format date with proper error handling
  const formatDate = (date: Date | string) => {
    if (!date) return t('time.notAvailable');
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return t('time.invalidDate');
      }
      
      return format(dateObj, 'PPP p');
    } catch (error) {
      console.error('Error formatting date:', error);
      return t('time.invalidDate');
    }
  };

  // Format time duration in minutes to readable format
  const formatDuration = (minutes: number) => {
    if (!minutes || minutes < 1) return t('time.lessThanMinute');
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}${t('time.hours')} ${remainingMinutes > 0 ? `${remainingMinutes}${t('time.minutes')}` : ''}`;
    }
    return `${remainingMinutes}${t('time.minutes')}`;
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('messages.copiedToClipboard'));
    } catch (error) {
      toast.error(t('messages.failedToCopy'));
    }
  };

  // Calculate total quantity
  const totalQuantity = order.products?.reduce((sum: number, product: any) => sum + product.quantity, 0) || 0;
  
  return (
    <div className="min-h-screen bg-muted/20 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Modern Header - Responsive */}
        <div className="bg-gradient-to-r from-background via-background to-muted/30 border rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Header Top Row */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/dashboard/seller/orders')}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {/* Action Buttons - Mobile */}
              <div className="flex items-center gap-2 sm:hidden">
                {(isCallCenter || isAdminOrModerator) && (
                  <Button variant="default" size="sm">
                    <PhoneCall className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/seller/orders/${order._id}#history`}>
                    <History className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Header Content */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-xl sm:rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                      <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{order.orderId}</h1>
                      <Badge variant="outline" className={`${statusConfig.className} h-6 sm:h-8 px-2 sm:px-4 text-xs sm:text-sm font-medium`}>
                        <StatusIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {statusConfig.label}
                      </Badge>
                      {order.isDouble && (
                        <Badge variant="outline" className="border-purple-500 bg-purple-500/10 h-6 sm:h-8 px-2 sm:px-4 text-xs sm:text-sm font-medium">
                          <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {t('badges.doubleOrder')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm sm:text-base text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="font-medium text-foreground truncate">{order.customer?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{formatDate(order.orderDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="font-semibold text-foreground">{formatPrice(order.totalPrice, order.warehouseId)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Desktop */}
              <div className="hidden sm:flex items-center gap-3">
                {(isCallCenter || isAdminOrModerator) && (
                  <>
                    <Button variant="default" className="h-11 px-6">
                      <PhoneCall className="h-4 w-4 mr-2" />
                      {t('actions.makeCall')}
                    </Button>
                    <Button variant="outline" className="h-11 px-6">
                      {t('actions.updateStatus')}
                    </Button>
                  </>
                )}
                <Button variant="outline" className="h-11 px-6" asChild>
                  <Link href={`/dashboard/seller/orders/${order._id}#history`}>
                    <History className="h-4 w-4 mr-2" />
                    {t('statusHistory.title')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Order Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{t('sections.orderInfo')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('fields.orderId')}
                      </p>
                      <div className="flex items-center space-x-3">
                        <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <code className="bg-muted px-3 py-2 rounded-lg font-mono text-sm font-bold flex-1 truncate">
                          {order.orderId}
                        </code>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 flex-shrink-0"
                                onClick={() => copyToClipboard(order.orderId)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('tooltips.copyOrderId')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('fields.totalPrice')}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {formatPrice(order.totalPrice, order.warehouseId)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('fields.totalItems')}
                      </p>
                      <p className="text-lg sm:text-xl font-semibold">
                        {totalQuantity} {totalQuantity === 1 ? t('products.item') : t('products.items')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('fields.orderDate')}
                      </p>
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm sm:text-base">
                          {formatDate(order.orderDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('fields.createdAt')}
                      </p>
                      <p className="text-sm sm:text-base">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('fields.lastUpdated')}
                      </p>
                      <p className="text-sm sm:text-base">
                        {formatDate(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{t('sections.customerInfo')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t('fields.customerName')}
                  </p>
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <p className="text-lg sm:text-xl font-semibold truncate">{order.customer?.name}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t('fields.phoneNumbers')}
                  </p>
                  <div className="space-y-3">
                    {order.customer?.phoneNumbers?.map((phone: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-mono text-sm sm:text-base truncate">{phone}</span>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 flex-shrink-0"
                                onClick={() => copyToClipboard(phone)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('tooltips.copyPhoneNumber')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t('fields.shippingAddress')}
                  </p>
                  <div className="p-4 border rounded-lg bg-background">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <p className="text-sm sm:text-base leading-relaxed">{order.customer?.shippingAddress}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{t('sections.productsList')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.products && order.products.length > 0 ? (
                    order.products.map((product: any, index: number) => (
                      <div key={product.productId || index} className="border rounded-xl p-4 sm:p-6 bg-muted/20 hover:bg-muted/30 transition-colors">
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold truncate">{product.productName}</h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <code className="bg-background border px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-mono">
                                  {product.productCode}
                                </code>
                                {product.variantCode && (
                                  <code className="bg-muted border px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-mono">
                                    {product.variantCode}
                                  </code>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-sm sm:text-base px-3 sm:px-4 py-2 whitespace-nowrap">
                              {t('products.qty')}: {product.quantity}
                            </Badge>
                          </div>
                          
                          <Separator />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">{t('products.unitPrice')}</span>
                              <p className="font-semibold text-sm sm:text-base">
                                {formatPrice(product.unitPrice, order.warehouseId)}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">{t('products.quantity')}</span>
                              <p className="font-semibold text-sm sm:text-base">{product.quantity}</p>
                            </div>
                            <div className="sm:text-right">
                              <span className="text-sm text-muted-foreground">{t('products.subtotal')}</span>
                              <p className="font-bold text-base sm:text-lg">
                                {formatPrice(product.unitPrice * product.quantity, order.warehouseId)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{t('messages.noProductsInOrder')}</p>
                    </div>
                  )}
                  
                  {order.products && order.products.length > 0 && (
                    <>
                      <Separator />
                      <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4 sm:p-6">
                        <div className="flex items-center justify-between text-xl sm:text-2xl font-bold">
                          <span>{t('products.orderTotal')}:</span>
                          <span>{formatPrice(order.totalPrice, order.warehouseId)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <Card className="shadow-sm" id='history'>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{t('statusHistory.title')}</CardTitle>
                  </div>
                  <CardDescription>
                    {t('statusHistory.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-auto max-h-96">
                    <div className="space-y-4">
                      {order.statusHistory.map((history: any, index: number) => {
                        const statusConfig = getStatusConfig(history.currentStatus);
                        const StatusIcon = statusConfig.icon;
                        const isLast = index === order.statusHistory.length - 1;
                        
                        return (
                          <div key={history._id || index} className="relative">
                            {/* Timeline Line */}
                            {!isLast && (
                              <div className="absolute left-6 sm:left-8 top-12 sm:top-14 w-0.5 h-16 bg-border"></div>
                            )}
                            
                            <div className="flex items-start space-x-4">
                              {/* Status Icon */}
                              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${statusConfig.className}`}>
                                <StatusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              
                              {/* Status Details */}
                              <div className="flex-1 min-w-0 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-3">
                                      <h4 className="font-semibold text-sm sm:text-base">{statusConfig.label}</h4>
                                      {history.previousStatus && (
                                        <div className="flex items-center text-xs text-muted-foreground">
                                          <span className="hidden sm:inline">{t('statusHistory.changedFrom')}</span>
                                          <ArrowRight className="h-3 w-3 mx-1" />
                                          <span>{getStatusConfig(history.previousStatus).label}</span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                      {formatDate(history.changeDate)}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-2">
                                    {history.timeConsumedInPreviousStatus && (
                                      <Badge variant="outline" className="text-xs">
                                        <Timer className="h-3 w-3 mr-1" />
                                        {formatDuration(history.timeConsumedInPreviousStatus)}
                                      </Badge>
                                    )}
                                    {history.automaticChange && (
                                      <Badge variant="secondary" className="text-xs">
                                        {t('badges.auto')}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Comment */}
                                {history.comment && (
                                  <div className="bg-muted/50 p-3 rounded-lg border">
                                    <div className="flex items-start space-x-2">
                                      <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                      <p className="text-sm leading-relaxed">{history.comment}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Changed By */}
                                {history.changedBy && (
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <UserCheck className="h-3 w-3" />
                                    <span>{t('fields.changedBy')} {history.changedBy.name}</span>
                                    {history.changedByRole && (
                                      <Badge variant="outline" className="text-xs px-2 py-0">
                                        {history.changedByRole}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                
                                {/* Change Reason for automatic changes */}
                                {history.automaticChange && history.changeReason && (
                                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
                                    <strong>{t('fields.systemReason')}:</strong> {history.changeReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* Status & Comments */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{t('sections.statusInfo')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t('fields.currentStatus')}
                  </p>
                  <div className="space-y-3">
                    <Badge variant="outline" className={`${statusConfig.className} p-3 text-sm sm:text-base font-medium w-full justify-start`}>
                      <StatusIcon className="mr-3 h-5 w-5" />
                      {statusConfig.label}
                    </Badge>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {statusConfig.description}
                    </p>
                  </div>
                </div>
                
                {order.statusComment && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        {t('fields.statusComment')}
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <div className="flex items-start space-x-3">
                          <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                          <p className="text-sm leading-relaxed">{order.statusComment}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {t('fields.statusChangedAt')}
                    </p>
                    <p className="text-sm sm:text-base">
                      {formatDate(order.statusChangedAt)}
                    </p>
                  </div>
                  
                  {order.statusChangedBy && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('fields.changedBy')}
                      </p>
                      <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium truncate">{order.statusChangedBy.name}</span>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {order.statusChangedBy.role}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {t('fields.orderIdInternal')}
                    </p>
                    <p className="text-xs sm:text-sm font-mono bg-muted px-3 py-2 rounded-lg border break-all">
                      {order._id}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call History */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PhoneCall className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{t('callHistory.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t('callHistory.totalAttempts')}
                  </p>
                  <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <PhoneCall className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{order.totalCallAttempts || 0}</p>
                  </div>
                </div>
                
                {order.lastCallAttempt && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {t('callHistory.lastAttempt')}
                        </p>
                        <p className="text-sm sm:text-base">
                          {formatDate(order.lastCallAttempt)}
                        </p>
                      </div>
                      
                      {order.lastCallStatus && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {t('callHistory.lastStatus')}
                          </p>
                          <Badge variant="outline" className={`${getCallStatusConfig(order.lastCallStatus).className} p-2 text-sm`}>
                            {getCallStatusConfig(order.lastCallStatus).label}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t('callHistory.attemptDetails')}
                  </p>
                  {order.callAttempts && order.callAttempts.length > 0 ? (
                    <ScrollArea className="h-auto">
                      <div className="space-y-3">
                        {order.callAttempts.map((attempt: any, index: number) => (
                          <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="font-medium text-xs">#{attempt.attemptNumber}</Badge>
                                <span className="font-mono text-xs sm:text-sm truncate">{attempt.phoneNumber}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={`text-xs ${getCallStatusConfig(attempt.status).className}`}>
                                {getCallStatusConfig(attempt.status).label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(attempt.attemptDate), 'MM/dd HH:mm')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8">
                      <PhoneCall className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t('callHistory.noAttempts')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Warehouse Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{t('sections.warehouseInfo')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {t('fields.warehouseName')}
                  </p>
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm sm:text-base font-medium truncate">{order.warehouseName || t('misc.unknownWarehouse')}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {t('fields.warehouseLocation')}
                  </p>
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm sm:text-base truncate">{order.warehouseCountry || t('misc.unknown')}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {t('fields.warehouseCurrency')}
                  </p>
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm sm:text-base font-mono">{order.warehouseCurrency || 'USD'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information (Admin/Moderator only) */}
            {isAdminOrModerator && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{t('sections.sellerInfo')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {t('fields.sellerName')}
                    </p>
                    <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm sm:text-base font-medium truncate">{order.sellerName || t('misc.unknownSeller')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {t('fields.sellerId')}
                    </p>
                    <p className="text-xs sm:text-sm font-mono bg-muted px-3 py-2 rounded-lg border break-all">
                      {order.sellerId}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Double Orders (if applicable) */}
        {order.isDouble && order.doubleOrderReferences && order.doubleOrderReferences.length > 0 && (
          <Card id='double' className="shadow-sm border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Users className="h-5 w-5 text-destructive" />
                </div>
                <CardTitle className="text-lg sm:text-xl text-destructive">{t('doubleOrderDetection.title')}</CardTitle>
              </div>
              <CardDescription className="mt-2">
                {t('doubleOrderDetection.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.doubleOrderReferences.map((ref: any, index: number) => (
                  <div key={index} className="border rounded-xl p-4 sm:p-6 bg-background">
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                          <h4 className="text-base sm:text-lg font-semibold">{t('doubleOrderDetection.similarOrderFound')}</h4>
                          <code className="bg-muted border px-3 py-2 rounded text-xs sm:text-sm font-mono">
                            {ref.orderId}
                          </code>
                        </div>
                        <div className="text-left sm:text-right space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {ref.orderDate ? formatDate(ref.orderDate) : t('time.notAvailable')}
                          </p>
                          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                            <Link href={`/dashboard/seller/orders/${ref.orderId}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t('actions.viewOrder')}
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Customer Name Comparison */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">{t('doubleOrderDetection.comparisonSections.customerNameComparison')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t('doubleOrderDetection.labels.currentOrder')}</p>
                            <div className={`p-3 rounded-lg border ${ref.similarity?.sameName ? 'border-destructive bg-destructive/10 font-bold' : 'bg-muted/30'}`}>
                              <p className="text-sm truncate">{order.customer?.name}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t('doubleOrderDetection.labels.similarOrder')}</p>
                            <div className={`p-3 rounded-lg border ${ref.similarity?.sameName ? 'border-destructive bg-destructive/10 font-bold' : 'bg-muted/30'}`}>
                              <p className="text-sm truncate">{ref.customerName}</p>
                            </div>
                          </div>
                        </div>
                        {ref.similarity?.sameName && (
                          <Badge variant="destructive" className="text-xs">⚠️ {t('doubleOrderDetection.warnings.sameCustomerName')}</Badge>
                        )}
                      </div>

                      {/* Phone Number Comparison */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">{t('doubleOrderDetection.comparisonSections.phoneNumberComparison')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t('doubleOrderDetection.labels.currentOrder')}</p>
                            <div className="space-y-2">
                              {order.customer?.phoneNumbers?.map((phone: string, idx: number) => (
                                <div key={idx} className={`p-2 rounded border font-mono text-xs sm:text-sm ${ref.similarity?.samePhone ? 'border-destructive bg-destructive/10 font-bold' : 'bg-muted/30'}`}>
                                  <span className="break-all">{phone}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t('doubleOrderDetection.labels.similarOrder')}</p>
                            <div className={`p-2 rounded border font-mono text-xs sm:text-sm ${ref.similarity?.samePhone ? 'border-destructive bg-destructive/10 font-bold' : 'bg-muted/30'}`}>
                              <span className="break-all">{ref.phoneNumbers || t('doubleOrderDetection.labels.phoneNotAvailable')}</span>
                            </div>
                          </div>
                        </div>
                        {ref.similarity?.samePhone && (
                          <Badge variant="destructive" className="text-xs">⚠️ {t('doubleOrderDetection.warnings.samePhoneNumber')}</Badge>
                        )}
                      </div>

                      {/* Products Comparison */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">{t('doubleOrderDetection.comparisonSections.productsComparison')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t('doubleOrderDetection.labels.currentOrderProducts')}</p>
                            <div className="space-y-2">
                              {order.products?.slice(0, 3).map((product: any, idx: number) => (
                                <div key={idx} className={`p-3 rounded-lg border ${ref.similarity?.sameProduct ? 'border-destructive bg-destructive/10' : 'bg-muted/30'}`}>
                                  <p className={`font-medium text-xs sm:text-sm ${ref.similarity?.sameProduct ? 'font-bold' : ''} truncate`}>
                                    {product.productName}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {t('misc.code')}: {product.productCode} | {t('products.qty')}: {product.quantity}
                                  </p>
                                </div>
                              ))}
                              {order.products?.length > 3 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  +{order.products.length - 3} {t('products.moreProducts')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t('doubleOrderDetection.labels.similarOrderProducts')}</p>
                            <div className={`p-3 rounded-lg border text-xs sm:text-sm ${ref.similarity?.sameProduct ? 'border-destructive bg-destructive/10 font-bold' : 'bg-muted/30'}`}>
                              <span className="break-words">{ref.products || t('doubleOrderDetection.labels.productDetailsNotAvailable')}</span>
                            </div>
                          </div>
                        </div>
                        {ref.similarity?.sameProduct && (
                          <Badge variant="destructive" className="text-xs">⚠️ {t('doubleOrderDetection.warnings.sameProducts')}</Badge>
                        )}
                      </div>

                      {/* Order Date Comparison */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">{t('doubleOrderDetection.comparisonSections.orderTimingComparison')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t('doubleOrderDetection.labels.currentOrder')}</p>
                            <div className="p-3 rounded-lg border bg-muted/30">
                              <p className="text-xs sm:text-sm">{formatDate(order.orderDate)}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t('doubleOrderDetection.labels.similarOrder')}</p>
                            <div className="p-3 rounded-lg border bg-muted/30">
                              <p className="text-xs sm:text-sm">{ref.orderDate ? formatDate(ref.orderDate) : t('time.notAvailable')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs bg-muted/50 p-3 rounded-lg gap-2">
                          <span className="text-muted-foreground">
                            {t('doubleOrderDetection.labels.timeDifference')}: {ref.similarity?.orderDateDifference || 0} {t('doubleOrderDetection.labels.hoursApart')}
                          </span>
                          {(ref.similarity?.orderDateDifference || 0) < 24 && (
                            <Badge variant="outline" className="text-xs border-orange-500 bg-orange-500/10 w-fit">
                              ⏰ {t('doubleOrderDetection.warnings.within24Hours')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="pt-4 border-t">
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="outline" className="text-xs sm:text-sm px-3 py-1">
                            {t('doubleOrderDetection.labels.similarityScore')}: {[
                              ref.similarity?.sameName,
                              ref.similarity?.samePhone,
                              ref.similarity?.sameProduct
                            ].filter(Boolean).length}/3
                          </Badge>
                          {ref.similarity?.sameName && (
                            <Badge variant="destructive" className="text-xs">{t('doubleOrderDetection.warnings.sameCustomer')}</Badge>
                          )}
                          {ref.similarity?.samePhone && (
                            <Badge variant="destructive" className="text-xs">{t('doubleOrderDetection.warnings.samePhone')}</Badge>
                          )}
                          {ref.similarity?.sameProduct && (
                            <Badge variant="destructive" className="text-xs">{t('doubleOrderDetection.warnings.sameProducts')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
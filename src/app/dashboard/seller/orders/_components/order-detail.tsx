'use client';

// src/app/[locale]/dashboard/orders/[id]/_components/order-details.tsx
import { useTranslations } from 'next-intl';
import { 
  CheckCircle,
  XCircle,
  Clock3,
  Phone,
  Users,
  PhoneCall,
  AlertTriangle,
  UserCheck,
  Truck,
  Navigation,
  MapPin,
  PackageX,
} from 'lucide-react';
import { format } from 'date-fns';

import { OrderStatus } from '@/lib/db/models/order';
import { UserRole } from '@/lib/db/models/user';

// Import all order detail components
import OrderHeader from './order-detail/order-header';
import OrderInfoCard from './order-detail/order-info-card';
import CustomerInfoCard from './order-detail/customer-info-card';
import ProductsCard from './order-detail/products-card';
import StatusHistoryCard from './order-detail/status-history-card';
import StatusInfoCard from './order-detail/status-info-card';
import CallHistoryCard from './order-detail/call-history-card';
import WarehouseInfoCard from './order-detail/warehouse-info-card';
import SellerInfoCard from './order-detail/seller-info-card';
import DoubleOrdersCard from './order-detail/double-orders-card';
import DiscountSummaryCard from './order-detail/discount-summary-card';
import DeliveryTrackingCard from './order-detail/delivery-tracking-card';

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

  // Check if user is admin or moderator
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
  
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
      [OrderStatus.SHIPPED]: { 
        label: t('statuses.shipped'), 
        description: t('statusDescriptions.shipped'),
        className: 'border-blue-500 bg-blue-500/10',
        icon: CheckCircle
      },
      [OrderStatus.ASSIGNED_TO_DELIVERY]: { 
        label: t('statuses.assigned_to_delivery'), 
        description: t('statusDescriptions.assigned_to_delivery'),
        className: 'border-indigo-500 bg-indigo-500/10',
        icon: UserCheck
      },
      [OrderStatus.ACCEPTED_BY_DELIVERY]: { 
        label: t('statuses.accepted_by_delivery'), 
        description: t('statusDescriptions.accepted_by_delivery'),
        className: 'border-cyan-500 bg-cyan-500/10',
        icon: CheckCircle
      },
      [OrderStatus.IN_TRANSIT]: { 
        label: t('statuses.in_transit'), 
        description: t('statusDescriptions.in_transit'),
        className: 'border-blue-600 bg-blue-600/10',
        icon: Navigation
      },
      [OrderStatus.OUT_FOR_DELIVERY]: { 
        label: t('statuses.out_for_delivery'), 
        description: t('statusDescriptions.out_for_delivery'),
        className: 'border-emerald-500 bg-emerald-500/10',
        icon: Truck
      },
      [OrderStatus.DELIVERED]: { 
        label: t('statuses.delivered'), 
        description: t('statusDescriptions.delivered'),
        className: 'border-green-500 bg-green-500/10',
        icon: CheckCircle
      },
      [OrderStatus.DELIVERY_FAILED]: { 
        label: t('statuses.delivery_failed'), 
        description: t('statusDescriptions.delivery_failed'),
        className: 'border-red-500 bg-red-500/10',
        icon: PackageX
      },
      [OrderStatus.REFUNDED]: { 
        label: t('statuses.refunded'), 
        description: t('statusDescriptions.refunded'),
        className: 'border-yellow-500 bg-yellow-500/10',
        icon: AlertTriangle
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


  // Format price with currency based on warehouse
  const formatPrice = (price: number) => {
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

  // Calculate total quantity
  const totalQuantity = order.products?.reduce((sum: number, product: any) => sum + product.quantity, 0) || 0;
  
  return (
    <div className="min-h-screen bg-muted/20 p-3 sm:p-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Modern Header - Responsive */}
        <OrderHeader
          order={order}
          formatDate={formatDate}
          formatPrice={formatPrice}
          getStatusConfig={getStatusConfig}
          userRole={userRole as UserRole}
         />

        {/* Content Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Order Information */}
            <OrderInfoCard
              order={order}
              formatDate={formatDate}
              formatPrice={formatPrice}
              totalQuantity={totalQuantity}
            />

            {/* Customer Information */}
            <CustomerInfoCard
              order={order}
            />

            {/* Products */}
            <ProductsCard 
              formatPrice={formatPrice}
              order={order}
            />

            {/* Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <StatusHistoryCard 
                order={order}
                formatDate={formatDate}
                formatDuration={formatDuration}
                getStatusConfig={getStatusConfig}
              />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* Discount Summary */}
            <DiscountSummaryCard
              order={order}
              formatPrice={formatPrice}
            />

            {/* Delivery Tracking */}
            {order.deliveryTracking && (
              <DeliveryTrackingCard
                order={order}
                formatDate={formatDate}
                formatPrice={formatPrice}
                userRole={userRole}
              />
            )}

            {/* Status & Comments */}
            <StatusInfoCard 
              formatDate={formatDate}
              getStatusConfig={getStatusConfig}
              order={order}
            />

            {/* Call History */}
            <CallHistoryCard
              formatDate={formatDate}
              order={order}
              userRole={userRole as UserRole}
            />

            {/* Warehouse Information */}
            <WarehouseInfoCard
              order={order}
            />

            {/* Seller Information (Admin/Moderator only) */}
            {isAdminOrModerator && (
              <SellerInfoCard
                order={order}
                userRole={userRole}
              />
            )}
          </div>
        </div>

        {/* Double Orders (if applicable) */}
        {order.isDouble && order.doubleOrderReferences && order.doubleOrderReferences.length > 0 && (
          <DoubleOrdersCard
            formatDate={formatDate}
            order={order}
            userRole={userRole}
          />
        )}
      </div>
    </div>
  );
}
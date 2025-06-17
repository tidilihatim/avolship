'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Calendar, 
  DollarSign, 
  PhoneCall,
  History,
  Users
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/lib/db/models/order';
import { UserRole } from '@/lib/db/models/user';

interface OrderHeaderProps {
  order: any;
  userRole?: string;
  getStatusConfig: (status: OrderStatus) => any;
  formatPrice: (price: number, warehouseId?: string) => string;
  formatDate: (date: Date | string) => string;
}

export default function OrderHeader({ 
  order, 
  userRole, 
  getStatusConfig, 
  formatPrice, 
  formatDate 
}: OrderHeaderProps) {
  const t = useTranslations('orders');
  const router = useRouter();

  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
  const isCallCenter = userRole === UserRole.CALL_CENTER;
  
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-gradient-to-r from-background via-background to-muted/30 border rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header Top Row */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/dashboard/${userRole}/orders`)}
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
              <Link href={`/dashboard/${userRole}/orders/${order._id}#history`}>
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
              <Link href={`/dashboard/${userRole}/orders/${order._id}#history`}>
                <History className="h-4 w-4 mr-2" />
                {t('statusHistory.title')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
// src/components/call-center/EnhancedCallCenterQueue.tsx

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  History
} from 'lucide-react';
import { OrderItem } from '@/types/socket';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useOrderQueue } from '@/hooks/use-order-queue';
import EnhancedOrderCard, { OrderStatus, CallAttempt } from './order-card';
import { toast } from 'sonner';
import { updateOrderStatus } from '@/app/actions/order';
import { useSession } from 'next-auth/react';
import { getAccessToken } from '@/app/actions/cookie';

// Queue Status Indicator
function QueueStatus({
  isConnected,
  isAvailable,
  t
}: {
  isConnected: boolean;
  isAvailable: boolean;
  t: any;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-3 h-3 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500"
      )} />
      <span className="text-sm font-medium">
        {isConnected
          ? (isAvailable ? t('callCenter.queue.status.available') : t('callCenter.queue.status.unavailable'))
          : t('callCenter.queue.status.disconnected')
        }
      </span>
    </div>
  );
}

// Call History Component
function CallHistoryCard({ t }: { t: any }) {
  const [callHistory, setCallHistory] = useState<any[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          {t('callCenter.queue.callHistory.title')}
        </CardTitle>
        <CardDescription>
          {t('callCenter.queue.callHistory.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {callHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('callCenter.queue.callHistory.empty', 'No calls made today')}
          </p>
        ) : (
          <div className="space-y-2">
            {callHistory.map((call, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium">{call.customerName}</p>
                  <p className="text-xs text-muted-foreground">{call.phoneNumber}</p>
                </div>
                <Badge variant={call.status === 'answered' ? 'default' : 'secondary'}>
                  {call.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Enhanced Component
export default function EnhancedCallCenterQueue() {
  const t = useTranslations();
  const { data: session } = useSession();

  const {
    queueStats,
    availableOrders,
    isLoading,
    isAvailable,
    isConnected,
    requestOrderAssignment,
    updateAvailability,
    refreshQueue
  } = useOrderQueue();
  
  // Handle order status update
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, comment?: string, shouldUpdateStock?: boolean) => {
    try {
      // Call your API to update order status with stock movement control
      const response = await updateOrderStatus(orderId, status, comment, undefined, shouldUpdateStock);

      if (response?.success) {
        toast.success(`Order status updated to ${status}`);
        // Refresh queue to get updated data
        refreshQueue();

      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  // Handle call attempt (now handled by MakeCallButton component)
  const handleMakeCallAttempt = async (orderId: string, attempt: CallAttempt) => {
    // This function is kept for compatibility but the actual call recording
    // is now handled by the MakeCallButton component with full recording functionality
    toast.success(`Call completed: ${attempt.status}`);
    refreshQueue();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('callCenter.queue.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('callCenter.queue.description')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <QueueStatus isConnected={isConnected} isAvailable={isAvailable} t={t} />
          <Button onClick={refreshQueue} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('callCenter.queue.stats.myQueue')}
                </p>
                <p className="text-2xl font-bold">{queueStats.queueCount}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('callCenter.queue.stats.available')}
                </p>
                <p className="text-2xl font-bold">{availableOrders.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('callCenter.queue.stats.status')}
                </p>
                <p className="text-lg font-semibold">
                  {isAvailable
                    ? t('callCenter.queue.status.available')
                    : t('callCenter.queue.status.unavailable')
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isAvailable}
                  onCheckedChange={updateAvailability}
                  disabled={!isConnected}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <CallHistoryCard t={t} />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="my-queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-queue">
            {t('callCenter.queue.myQueue')} ({queueStats.queueCount})
          </TabsTrigger>
          <TabsTrigger value="available">
            {t('callCenter.queue.availableOrders')} ({availableOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-queue" className="space-y-4">
          {queueStats.orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('callCenter.queue.empty.noOrdersInQueue')}
                </h3>
                <p className="text-muted-foreground">
                  {t('callCenter.queue.empty.noOrdersInQueueDescription')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {queueStats.orders.map((order) => (
                <EnhancedOrderCard
                  key={order.orderId}
                  order={order}
                  type="assigned"
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onMakeCallAttempt={handleMakeCallAttempt}
                  currentAgentId={session?.user?.id}
                  t={t}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {availableOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('callCenter.queue.empty.noAvailableOrders')}
                </h3>
                <p className="text-muted-foreground">
                  {t('callCenter.queue.empty.noAvailableOrdersDescription')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {availableOrders.map((order) => (
                <EnhancedOrderCard
                  key={order.orderId}
                  order={order}
                  type="available"
                  onRequestAssignment={requestOrderAssignment}
                  currentAgentId={session?.user?.id}
                  t={t}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
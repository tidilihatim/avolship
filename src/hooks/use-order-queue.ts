'use client';

import { useState, useEffect, useCallback } from 'react';
import { OrderItem, QueueStats } from '@/types/socket';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useSocket } from '@/lib/socket/use-socket';
import { getAccessToken } from '@/app/actions/cookie';

export function useOrderQueue() {
  const [queueStats, setQueueStats] = useState<QueueStats>({
    queueCount: 0,
    workloadCount: 0,
    orders: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [availableOrders, setAvailableOrders] = useState<OrderItem[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  const { socket, isConnected, on, emit } = useSocket();
  const { data: session } = useSession();

  // Add loading timeout - automatically stop loading after 5 seconds
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout reached, setting loading to false');
        setIsLoading(false);
        // Optionally fetch data directly from API as fallback
        if (session?.user?.id) {
          refreshQueue();
        }
      }, 5000); // 5 second timeout

      setLoadingTimeout(timeout);

      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [isLoading, session?.user?.id]);

  // Set up socket event listeners
  useEffect(() => {
    if (!isConnected || !socket) {
      // If not connected, try to fallback to API after a short delay
      const fallbackTimeout = setTimeout(() => {
        if (isLoading && session?.user?.id) {
          console.log('Socket not connected, falling back to API');
          refreshQueue();
        }
      }, 3000);

      return () => clearTimeout(fallbackTimeout);
    }

    console.log('Setting up order queue socket listeners');

    // Authentication success
    const unsubscribeAuthSuccess = on('auth:success', (data) => {
      console.log('Authentication successful:', data);
      // If user is call center agent, the socket will automatically send queue data
    });

    // Authentication error
    const unsubscribeAuthError = on('auth:error', (data) => {
      console.error('Authentication failed:', data);
      toast.error(`Authentication failed: ${data.message}`);
      setIsLoading(false);
    });

    // Initial queue data
    const unsubscribeInitial = on('queue:initial', (data) => {
      console.log('Received initial queue data:', data);
      setQueueStats({
        queueCount: data.queueCount,
        workloadCount: data.workloadCount,
        orders: data.orders
      });
      setIsLoading(false);
    });

    // Queue updates
    const unsubscribeUpdate = on('queue:update', (data) => {
      console.log('Received queue update:', data);
      setQueueStats(prev => ({
        ...prev,
        queueCount: data.queueCount,
        orders:data.orders
      }));
    });

    // New order assigned to this agent
    const unsubscribeAssigned = on('order:assigned', (data) => {
      console.log('Order assigned to me:', data);
      const newOrder: OrderItem = {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        customer: data.customer,
        products: data.products,
        totalPrice: data.totalPrice,
        status: data.status,
        createdAt: new Date(),
        assignedAt: data.assignedAt,
        lockExpiry: data.lockExpiry,
        seller: data.seller,
        warehouse: data.warehouse
      };

      setQueueStats(prev => ({
        ...prev,
        orders: [...prev.orders, newOrder],
        queueCount: prev.queueCount + 1,
        workloadCount: prev.workloadCount + 1
      }));

      toast.success(`New order ${data.orderNumber} assigned to you!`);
    });

    // New order available (broadcast to all agents)
    const unsubscribeNewOrder = on('order:new', (data) => {
      console.log('New order available:', data);
      if (!data.isAssigned) {
        const newAvailableOrder: OrderItem = {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          customer: data.customer,
          totalPrice: data.totalPrice,
          status: data.status,
          createdAt: data.createdAt
        };

        setAvailableOrders(prev => [...prev, newAvailableOrder]);
        toast.info(`New order ${data.orderNumber} is available!`);
      }
    });

    // Order no longer available
    const unsubscribeUnavailable = on('order:unavailable', (data) => {
      console.log('Order no longer available:', data);
      setAvailableOrders(prev => 
        prev.filter(order => order.orderId !== data.orderId)
      );
    });

    // Assignment result
    const unsubscribeAssignmentResult = on('order:assignment-result', (data) => {
      console.log('Assignment result:', data);
      if (data.success) {
        toast.success(data.message);
        // Remove from available orders
        setAvailableOrders(prev => 
          prev.filter(order => order.orderId !== data.orderId)
        );
      } else {
        toast.error(data.message);
      }
    });

    // Order removed from queue
    const unsubscribeRemoved = on('order:removed', (data) => {
      console.log('Order removed from queue:', data);
      setQueueStats(prev => ({
        ...prev,
        orders: prev.orders.filter(order => order.orderId !== data.orderId),
        queueCount: Math.max(0, prev.queueCount - 1),
        workloadCount: Math.max(0, prev.workloadCount - 1)
      }));
      toast.info(data.message);
    });

    // Cleanup function
    return () => {
      unsubscribeAuthSuccess();
      unsubscribeAuthError();
      unsubscribeInitial();
      unsubscribeUpdate();
      unsubscribeAssigned();
      unsubscribeNewOrder();
      unsubscribeUnavailable();
      unsubscribeAssignmentResult();
      unsubscribeRemoved();
    };
  }, [isConnected, socket, on]);

  // Request order assignment
  const requestOrderAssignment = useCallback((orderId: string) => {
    if (!isConnected) {
      toast.error('Not connected to server');
      return;
    }

    console.log('Requesting assignment for order:', orderId);
    emit('order:request-assignment', { orderId });
  }, [isConnected, emit]);


  // Update agent availability status
  const updateAvailability = useCallback((available: boolean) => {
    if (!isConnected) {
      toast.error('Not connected to server');
      return;
    }

    console.log('Updating availability to:', available);
    setIsAvailable(available);
    emit('agent:status', { available });
  }, [isConnected, emit]);

  // Refresh queue data
  const refreshQueue = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      // The socket will automatically send updated queue data
      // when the agent reconnects or requests fresh data
      // Fetch fresh queue data from the API
      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

       const jwtToken = await getAccessToken();
        if (!jwtToken) {
          return toast.error("Configuration Error")
        }
      const response = await fetch(`${SOCKET_URL}/api/orders/queue/${session.user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          "authorization": `Bearer ${jwtToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch workload stats');
      }

      setQueueStats(result.data);
      
      
    } catch (error) {
      console.error('Error refreshing queue:', error);
      toast.error('Failed to refresh queue');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, isConnected, emit]);

  return {
    queueStats,
    availableOrders,
    isLoading,
    isAvailable,
    isConnected,
    requestOrderAssignment,
    updateAvailability,
    refreshQueue
  };
}
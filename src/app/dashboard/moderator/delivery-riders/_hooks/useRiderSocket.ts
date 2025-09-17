'use client';

import { useEffect } from 'react';
import { useSocket } from '@/lib/socket/use-socket';
import { DeliveryRider } from './useDeliveryRiders';
import { getAccessToken } from '@/app/actions/cookie';

interface UseRiderSocketProps {
  riders: DeliveryRider[];
  updateRider: (riderId: string, updates: Partial<DeliveryRider>) => void;
  addRider: (rider: DeliveryRider) => void;
}

export const useRiderSocket = ({ riders, updateRider, addRider }: UseRiderSocketProps) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for real-time location updates
    const handleLocationUpdate = (data: {
      riderId: string;
      location: {
        latitude: number;
        longitude: number;
        timestamp: Date;
        accuracy?: number;
      };
    }) => {
      const existingRider = riders.find(rider => rider.id === data.riderId);
      
      if (existingRider) {
        updateRider(data.riderId, {
          currentLocation: data.location,
          lastActive: new Date(),
          isOnline: true
        });
      } else {
        // Fetch new rider details if not in current list
        fetchAndAddRider(data.riderId);
      }
    };

    // Listen for rider status updates
    const handleStatusUpdate = (data: {
      riderId: string;
      isOnline: boolean;
      isAvailableForDelivery: boolean;
    }) => {
      const existingRider = riders.find(rider => rider.id === data.riderId);
      
      if (data.isOnline) {
        if (existingRider) {
          updateRider(data.riderId, {
            isOnline: data.isOnline,
            isAvailableForDelivery: data.isAvailableForDelivery,
            lastActive: new Date()
          });
        } else {
          // Fetch full rider details for new online rider
          fetchAndAddRider(data.riderId);
        }
      } else {
        // Rider went offline
        if (existingRider) {
          updateRider(data.riderId, {
            isOnline: false,
            isAvailableForDelivery: false,
            lastActive: existingRider.lastActive || new Date()
          });
        }
      }
    };

    // Listen for rider orders updates
    const handleOrdersUpdate = (data: {
      riderId: string;
      orders: DeliveryRider['assignedOrders'];
    }) => {
      updateRider(data.riderId, {
        assignedOrders: data.orders
      });
    };

    // Fetch rider details helper
    const fetchAndAddRider = async (riderId: string) => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        
        const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
        const response = await fetch(`${API_URL}/api/admin/delivery-riders/${riderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const newRider: DeliveryRider = {
              ...result.data,
              currentLocation: result.data.currentLocation ? {
                ...result.data.currentLocation,
                timestamp: new Date(result.data.currentLocation.timestamp)
              } : undefined,
              lastActive: result.data.lastActive ? new Date(result.data.lastActive) : undefined
            };
            
            addRider(newRider);
          }
        }
      } catch (error) {
        console.error('Error fetching new rider:', error);
      }
    };

    // Set up socket listeners
    socket.on('admin:rider_location_update', handleLocationUpdate);
    socket.on('admin:rider_status_update', handleStatusUpdate);
    socket.on('admin:rider_orders_update', handleOrdersUpdate);

    // Cleanup listeners
    return () => {
      socket.off('admin:rider_location_update', handleLocationUpdate);
      socket.off('admin:rider_status_update', handleStatusUpdate);
      socket.off('admin:rider_orders_update', handleOrdersUpdate);
    };
  }, [socket, isConnected, riders, updateRider, addRider]);

  return { isConnected };
};
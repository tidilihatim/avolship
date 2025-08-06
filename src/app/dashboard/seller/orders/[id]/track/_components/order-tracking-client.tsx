'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Package, Filter } from 'lucide-react';
import RiderTrackingMap from '@/app/dashboard/admin/delivery-riders/_components/rider-tracking-map';
import { getOrdersByRiderId } from '@/app/actions/order';

interface Order {
  _id: string;
  orderId: string;
  customer: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  status: string;
  totalAmount: number;
}

interface DeliveryRider {
  id: string;
  name: string;
  email: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy?: number;
  };
  isOnline: boolean;
  isAvailableForDelivery: boolean;
}

interface OrderTrackingClientProps {
  initialOrder: Order;
  rider: DeliveryRider;
}

const STATUS_OPTIONS = [
  { value: 'assigned_to_delivery', label: 'Assigned to Delivery', color: 'bg-blue-500' },
  { value: 'accepted_by_delivery', label: 'Accepted by Delivery', color: 'bg-green-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-gray-500' }
];

export default function OrderTrackingClient({ 
  initialOrder, 
  rider 
}: OrderTrackingClientProps) {
  const [trackAllOrders, setTrackAllOrders] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([initialOrder]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilters, setStatusFilters] = useState<string[]>([
    'assigned_to_delivery', 
    'accepted_by_delivery', 
    'delivered'
  ]);

  const fetchAllOrders = async () => {
    setIsLoading(true);
    try {
      const result = await getOrdersByRiderId(rider.id, statusFilters);
      if (result.success) {
        setAllOrders(result.orders);
      } else {
        console.error('Failed to fetch all orders:', result.message);
        setAllOrders([initialOrder]);
      }
    } catch (error) {
      console.error('Error fetching all orders:', error);
      setAllOrders([initialOrder]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackAllToggle = async (checked: boolean) => {
    setTrackAllOrders(checked);
    
    if (checked) {
      await fetchAllOrders();
    } else {
      setAllOrders([initialOrder]);
    }
  };

  const handleStatusFilterChange = async (status: string, checked: boolean) => {
    const newFilters = checked 
      ? [...statusFilters, status]
      : statusFilters.filter(f => f !== status);
    
    setStatusFilters(newFilters);
    
    // If tracking all orders, refetch with new filters
    if (trackAllOrders) {
      if (newFilters.length > 0) {
        setIsLoading(true);
        try {
          const result = await getOrdersByRiderId(rider.id, newFilters);
          if (result.success) {
            setAllOrders(result.orders);
          } else {
            console.error('Failed to fetch filtered orders:', result.message);
            setAllOrders([]);
          }
        } catch (error) {
          console.error('Error fetching filtered orders:', error);
          setAllOrders([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        // No filters selected, show empty array
        setAllOrders([]);
      }
    }
  };

  const ordersToShow = trackAllOrders ? allOrders : [initialOrder];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Track Order</h1>
          <p className="text-muted-foreground">
            {trackAllOrders 
              ? `Real-time tracking for all ${rider.name}'s deliveries`
              : `Real-time tracking for order ${initialOrder.orderId}`
            }
          </p>
        </div>
        
        <div className="flex gap-4">
          {/* Status Filter Card - Show only when tracking all orders */}
          {trackAllOrders && (
            <Card className="p-4">
              <CardHeader className="p-0 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">Status Filters</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                {STATUS_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={statusFilters.includes(option.value)}
                      onCheckedChange={(checked) => 
                        handleStatusFilterChange(option.value, checked as boolean)
                      }
                      disabled={isLoading}
                    />
                    <Label htmlFor={option.value} className="text-xs flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Track All Orders Card */}
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Label htmlFor="track-all" className="text-sm font-medium">
                Track all orders
              </Label>
              <Switch
                id="track-all"
                checked={trackAllOrders}
                onCheckedChange={handleTrackAllToggle}
                disabled={isLoading}
              />
              {trackAllOrders && (
                <Badge variant="secondary" className="ml-2">
                  {allOrders.length} {allOrders.length === 1 ? 'order' : 'orders'}
                </Badge>
              )}
            </div>
            {trackAllOrders && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing filtered deliveries for {rider.name}
              </p>
            )}
          </Card>
        </div>
      </div>

      {isLoading ? (
        <Card className="h-[600px]">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-lg font-medium text-muted-foreground">Loading orders...</p>
            </div>
          </CardContent>
        </Card>
      ) : trackAllOrders && statusFilters.length === 0 ? (
        <Card className="h-[600px]">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No Status Filters Selected</p>
              <p className="text-sm text-muted-foreground">Please select at least one status filter to view orders</p>
            </div>
          </CardContent>
        </Card>
      ) : trackAllOrders && ordersToShow.length === 0 ? (
        <Card className="h-[600px]">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No Orders Found</p>
              <p className="text-sm text-muted-foreground">No orders match the selected status filters for this rider</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="h-[600px]">
          <RiderTrackingMap 
            rider={rider}
            orders={ordersToShow}
          />
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/lib/socket/use-socket';
import dynamic from 'next/dynamic';
import { Loader2, MapPin, User, Clock, Truck, Navigation, Activity, ArrowLeft } from 'lucide-react';
import { getAccessToken } from '@/app/actions/cookie';

// Dynamic import for the map component to avoid SSR issues
const RiderTrackingMap = dynamic(() => import('./_components/rider-tracking-map'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

interface DeliveryRider {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  isOnline: boolean;
  isAvailableForDelivery: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy?: number;
  };
  assignedOrders?: Array<{
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
  }>;
  deliveryStats?: {
    totalDeliveries: number;
    todayDeliveries: number;
    averageRating?: number;
  };
  lastActive?: Date;
}

export default function DeliveryRidersPage() {
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<DeliveryRider | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  const { socket, isConnected } = useSocket();

  // Fetch initial riders data from API
  useEffect(() => {
    const fetchRiders = async () => {
      try {
        setLoading(true);
        
        // Import server action to get token
  
        const token = await getAccessToken();
          
        if (!token) {
          console.error('No auth token found');
          setLoading(false);
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
        console.log('Fetching riders from:', `${API_URL}/api/admin/delivery-riders`);
        
        const response = await fetch(`${API_URL}/api/admin/delivery-riders`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Fetched riders from API:', result);
        console.log('Total riders received:', result.data?.riders?.length);
        console.log('Riders details:', result.data?.riders?.map((r:any) => ({ 
          id: r.id, 
          name: r.name, 
          isOnline: r.isOnline,
          hasLocation: !!r.currentLocation,
          assignedOrders: r.assignedOrders?.length || 0
        })));
        
        if (result.success) {
          setRiders(result.data.riders);
        }
      } catch (error) {
        console.error('Error fetching riders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();
  }, []);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    console.log('Socket setup effect - socket exists:', !!socket, 'isConnected:', isConnected);
    
    if (socket && isConnected) {
      console.log('Setting up socket listeners for real-time updates');

      // Listen for real-time location updates
      socket.on('admin:rider_location_update', (data: {
        riderId: string;
        location: {
          latitude: number;
          longitude: number;
          timestamp: Date;
          accuracy?: number;
        };
      }) => {
        console.log('🔥 RECEIVED admin:rider_location_update:', data);
        
        setRiders(prevRiders => {
          console.log('Current riders before location update:', prevRiders.map(r => ({ id: r.id, name: r.name, isOnline: r.isOnline })));
          
          const existingRider = prevRiders.find(rider => rider.id === data.riderId);
          console.log('Existing rider found:', !!existingRider, existingRider ? existingRider.name : 'none');
          
          if (!existingRider) {
            console.log('❌ Rider not found in current list, fetching rider details');
            // If rider is not in our list but sending location, fetch their details
            const fetchNewRider = async () => {
              try {
                const token = await getAccessToken();
                if (!token) return;
                
                const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
                const response = await fetch(`${API_URL}/api/admin/delivery-riders/${data.riderId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
                    const newRider = {
                      ...result.data,
                      isOnline: true,
                      currentLocation: data.location,
                      lastActive: new Date()
                    };
                    
                    console.log('✅ Fetched new rider details:', newRider);
                    setRiders(prev => [...prev, newRider]);
                  }
                }
              } catch (error) {
                console.error('Error fetching new rider:', error);
              }
            };
            
            fetchNewRider();
            return prevRiders;
          }

          const updatedRiders = prevRiders.map(rider => 
            rider.id === data.riderId 
              ? { ...rider, currentLocation: data.location, lastActive: new Date(), isOnline: true }
              : rider
          );

          console.log('Updated riders after location update:', updatedRiders.map(r => ({ id: r.id, name: r.name, isOnline: r.isOnline })));
          return updatedRiders;
        });

        // Update selected rider if it's the one being updated
        if (selectedRider?.id === data.riderId) {
          setSelectedRider(prev => prev ? { ...prev, currentLocation: data.location, lastActive: new Date() } : null);
        }
      });

      // Listen for rider status updates (online/offline)
      socket.on('admin:rider_status_update', (data: {
        riderId: string;
        isOnline: boolean;
        isAvailableForDelivery: boolean;
      }) => {
        console.log('🔥 RECEIVED admin:rider_status_update:', data);
        
        setRiders(prevRiders => {
          const existingRider = prevRiders.find(rider => rider.id === data.riderId);
          
          if (data.isOnline) {
            if (existingRider) {
              // Update existing rider
              return prevRiders.map(rider => 
                rider.id === data.riderId 
                  ? { 
                      ...rider, 
                      isOnline: data.isOnline, 
                      isAvailableForDelivery: data.isAvailableForDelivery,
                      lastActive: new Date()
                    }
                  : rider
              );
            } else {
              // Fetch full rider details and add them to the list
              console.log('New rider came online, fetching details:', data.riderId);
              
              // Fetch rider details in background
              const fetchNewRider = async () => {
                try {
                  const token = await getAccessToken();
                  if (!token) return;
                  
                  const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
                  const response = await fetch(`${API_URL}/api/admin/delivery-riders/${data.riderId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                      const newRider = {
                        id: result.data.id,
                        name: result.data.name,
                        email: result.data.email,
                        phone: result.data.phone,
                        country: result.data.country,
                        isOnline: data.isOnline,
                        isAvailableForDelivery: data.isAvailableForDelivery,
                        currentLocation: result.data.currentLocation,
                        assignedOrders: result.data.assignedOrders,
                        deliveryStats: result.data.deliveryStats,
                        lastActive: new Date()
                      };
                      
                      setRiders(prev => [...prev, newRider]);
                    }
                  }
                } catch (error) {
                  console.error('Error fetching new rider details:', error);
                }
              };
              
              fetchNewRider();
              return prevRiders;
            }
          } else {
            // Rider went offline - keep them in the list but mark as offline
            // Only remove from the "online" filter, but keep in main riders array
            return prevRiders.map(rider => 
              rider.id === data.riderId 
                ? { 
                    ...rider, 
                    isOnline: false, 
                    isAvailableForDelivery: false,
                    lastActive: rider.lastActive || new Date()
                  }
                : rider
            );
          }
        });

        // Update selected rider if it's the one being updated
        if (selectedRider?.id === data.riderId) {
          if (!data.isOnline) {
            // If selected rider went offline, go back to list
            setSelectedRider(null);
            setShowMap(false);
          } else {
            setSelectedRider(prev => prev ? {
              ...prev,
              isOnline: data.isOnline,
              isAvailableForDelivery: data.isAvailableForDelivery,
              lastActive: new Date()
            } : null);
          }
        }
      });

      // Listen for rider orders updates
      socket.on('admin:rider_orders_update', (data: {
        riderId: string;
        orders: DeliveryRider['assignedOrders'];
      }) => {
        console.log('🔥 RECEIVED admin:rider_orders_update:', data);
        setRiders(prevRiders => 
          prevRiders.map(rider => 
            rider.id === data.riderId 
              ? { ...rider, assignedOrders: data.orders }
              : rider
          )
        );

        // Update selected rider if it's the one being updated
        if (selectedRider?.id === data.riderId) {
          setSelectedRider(prev => prev ? { ...prev, assignedOrders: data.orders } : null);
        }
      });

      return () => {
        socket.off('admin:delivery_riders');
        socket.off('admin:rider_location_update');
        socket.off('admin:rider_status_update');
        socket.off('admin:rider_orders_update');
      };
    }
  }, [socket, isConnected, selectedRider?.id]);

  const onlineRiders = riders.filter(rider => rider.isOnline);
  const availableRiders = onlineRiders.filter(rider => rider.isAvailableForDelivery);

  const formatLastSeen = (lastActive?: Date) => {
    if (!lastActive) return 'Unknown';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(lastActive).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleRiderClick = async (rider: DeliveryRider) => {
    // First, fetch the latest rider data from DB to get current location
    try {
      const token = await getAccessToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
      const response = await fetch(`${API_URL}/api/admin/delivery-riders/${rider.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Use the fresh data from DB which includes currentLocation
          const freshRiderData = {
            ...rider,
            ...result.data,
            // Ensure we have the latest location data from DB and convert timestamp to Date
            currentLocation: result.data.currentLocation ? {
              ...result.data.currentLocation,
              timestamp: new Date(result.data.currentLocation.timestamp)
            } : rider.currentLocation,
            assignedOrders: result.data.assignedOrders || rider.assignedOrders,
            deliveryStats: result.data.deliveryStats || rider.deliveryStats
          };
          
          
          setSelectedRider(freshRiderData);
          setShowMap(true);
          
          // Now request real-time updates via socket for this rider
          socket?.emit('admin:get_rider_details', { riderId: rider.id });
        }
      } else {
        // Fallback to current rider data if API fails
        setSelectedRider(rider);
        setShowMap(true);
        socket?.emit('admin:get_rider_details', { riderId: rider.id });
      }
    } catch (error) {
      console.error('Error fetching fresh rider data:', error);
      // Fallback to current rider data
      setSelectedRider(rider);
      setShowMap(true);
      socket?.emit('admin:get_rider_details', { riderId: rider.id });
    }
  };

  const handleBackToList = () => {
    setShowMap(false);
    setSelectedRider(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-9 bg-gray-200 rounded-md w-80 animate-pulse" />
            <div className="h-5 bg-gray-100 rounded-md w-64 mt-2 animate-pulse" />
          </div>
          
          <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-12 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Riders List Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-96 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded w-48 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-28 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-14 animate-pulse" />
                    </div>
                    
                    <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
                    
                    <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show map view for selected rider
  if (showMap && selectedRider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Riders
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                selectedRider.isOnline ? 'bg-primary' : 'bg-destructive'
              }`} />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">{selectedRider.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Badge variant={selectedRider.isOnline ? "default" : "secondary"}>
                  {selectedRider.isOnline ? "Online" : "Offline"}
                </Badge>
                {selectedRider.isOnline && (
                  <Badge variant={selectedRider.isAvailableForDelivery ? "default" : "outline"}>
                    {selectedRider.isAvailableForDelivery ? "Available" : "Busy"}
                  </Badge>
                )}
                <span className="text-sm">
                  Last seen: {formatLastSeen(selectedRider.lastActive)}
                </span>
              </p>
            </div>
          </div>
          
          <div className="ml-auto">
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {isConnected ? "Live Tracking" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Rider stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Active Orders</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedRider.assignedOrders?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Today's Deliveries</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedRider.deliveryStats?.todayDeliveries || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">GPS Accuracy</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedRider.currentLocation?.accuracy ? 
                      `${selectedRider.currentLocation.accuracy.toFixed(0)}m` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time tracking map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Real-time Tracking
              {selectedRider.currentLocation && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  Location: {new Date(selectedRider.currentLocation.timestamp).toLocaleString()}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedRider.isOnline ? 
                `Live GPS tracking and assigned orders for ${selectedRider.name}` :
                `Last known location and orders for ${selectedRider.name} (Offline)`
              }
            </p>
          </CardHeader>
          
          <CardContent className="p-0">
            <div style={{ height: '600px' }}>
              <RiderTrackingMap 
                rider={selectedRider}
                orders={selectedRider.assignedOrders || []}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show riders list
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Delivery Riders</h1>
          <p className="text-muted-foreground">
            Click on any rider to view their tracking and location data
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineRiders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Delivery</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{availableRiders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Riders List */}
      <Card>
        <CardHeader>
          <CardTitle>All Riders</CardTitle>
          <p className="text-sm text-muted-foreground">
            All registered delivery riders with their online status and location data
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riders.map((rider) => (
              <div 
                key={rider.id} 
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors ${
                  rider.isOnline ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/20'
                }`}
                onClick={() => handleRiderClick(rider)}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                      rider.isOnline ? 'bg-primary' : 'bg-destructive'
                    }`} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-lg">{rider.name}</p>
                      <Badge variant={rider.isOnline ? "default" : "secondary"} className="text-xs">
                        {rider.isOnline ? "Online" : "Offline"}
                      </Badge>
                      {rider.isOnline && (
                        <Badge variant={rider.isAvailableForDelivery ? "default" : "outline"} className="text-xs">
                          {rider.isAvailableForDelivery ? "Available" : "Busy"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{rider.email}</p>
                    {rider.country && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {rider.country}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {rider.assignedOrders?.length || 0} active orders
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastSeen(rider.lastActive)}
                    </p>
                    {rider.deliveryStats && (
                      <p className="text-muted-foreground">
                        {rider.deliveryStats.todayDeliveries} deliveries today
                      </p>
                    )}
                    {rider.currentLocation ? (
                      <p className="text-xs text-primary flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Location Available
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        No Location Data
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Badge variant={rider.isAvailableForDelivery ? "default" : "outline"}>
                      {rider.isAvailableForDelivery ? "Available" : "Busy"}
                    </Badge>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Navigation className="h-4 w-4 mr-2" />
                    Track
                  </Button>
                </div>
              </div>
            ))}
            
            {riders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No delivery riders found</p>
                <p className="text-sm">Delivery riders will appear here once they register</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
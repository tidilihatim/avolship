'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Navigation, Clock, DollarSign, User, Package, Route, Target, Loader2 } from 'lucide-react';

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

interface RiderTrackingMapProps {
  rider: DeliveryRider;
  orders: Order[];
}

// Google Maps will be loaded dynamically
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const RiderTrackingMap: React.FC<RiderTrackingMapProps> = ({
  rider,
  orders
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const riderMarkerRef = useRef<any>(null);
  const activeInfoWindowRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const hasSetBounds = useRef(false);

  // Load Google Maps API
  useEffect(() => {
    if (window.google) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      setMapLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstance.current) return;

    // Default center (can be rider's location or a default location)
    const defaultCenter = rider.currentLocation 
      ? { lat: rider.currentLocation.latitude, lng: rider.currentLocation.longitude }
      : { lat: -4.440000, lng: 15.260000 }; // Default to Congo area

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: defaultCenter,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Add click listener to map to close info windows when clicking on empty areas
    mapInstance.current.addListener('click', () => {
      if (activeInfoWindowRef.current) {
        activeInfoWindowRef.current.close();
        activeInfoWindowRef.current = null;
        setSelectedOrder(null);
      }
    });

  }, [mapLoaded, rider.currentLocation]);

  // Update rider marker
  useEffect(() => {
    if (!mapInstance.current || !rider.currentLocation) return;

    // Remove existing rider marker
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setMap(null);
    }

    // Create simple purple rider marker
    const riderIcon = {
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="20" fill="#8b5cf6" stroke="white" stroke-width="3"/>
      <text x="22" y="28" text-anchor="middle" fill="white" font-size="16">🚚</text>
      <circle cx="34" cy="10" r="4" fill="#10b981" stroke="white" stroke-width="2"/>
    </svg>
  `)}`,
  scaledSize: new window.google.maps.Size(44, 44),
  anchor: new window.google.maps.Point(22, 22)
};

    riderMarkerRef.current = new window.google.maps.Marker({
      position: {
        lat: rider.currentLocation.latitude,
        lng: rider.currentLocation.longitude
      },
      map: mapInstance.current,
      icon: riderIcon,
      title: `${rider.name} - Delivery Rider`,
      zIndex: 1000
    });

    // Add theme-aware info window for rider
    const riderInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; min-width: 200px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #3b82f6;"></div>
            <h3 style="font-weight: 600; color: #1f2937; margin: 0;">${rider.name}</h3>
          </div>
          <div style="font-size: 14px; line-height: 1.5;">
            <p style="margin: 4px 0; color: #4b5563;">📍 Delivery Rider</p>
            <p style="margin: 4px 0; color: #4b5563;">
              🎯 Status: <span style="font-weight: 500; color: ${rider.isAvailableForDelivery ? '#16a34a' : '#ea580c'};">${rider.isAvailableForDelivery ? 'Available' : 'Busy'}</span>
            </p>
            <p style="margin: 4px 0; color: #6b7280; font-size: 12px;">
              📶 GPS Accuracy: ${rider.currentLocation.accuracy ? `${rider.currentLocation.accuracy.toFixed(0)}m` : 'Unknown'}
            </p>
          </div>
        </div>
      `
    });

    riderMarkerRef.current.addListener('click', () => {
      // Close any existing info window
      if (activeInfoWindowRef.current) {
        activeInfoWindowRef.current.close();
      }
      // Open rider info window and set as active
      riderInfoWindow.open(mapInstance.current, riderMarkerRef.current);
      activeInfoWindowRef.current = riderInfoWindow;
    });

    // Center map on rider
    mapInstance.current.setCenter({
      lat: rider.currentLocation.latitude,
      lng: rider.currentLocation.longitude
    });

  }, [rider.currentLocation, rider.name, rider.isAvailableForDelivery]);

  // Update order markers
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) {
      return;
    }

    console.log('Updating order markers, orders count:', orders.length);

    // Clear existing order markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add order markers
    orders.forEach((order, index) => {
      if (!order.customer.coordinates) {
        return;
      }
      
      // Determine marker color based on order status
      const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
          case 'assigned_to_delivery':
            return '#3b82f6'; // Blue for newly assigned
          case 'accepted_by_delivery':
            return '#10b981'; // Green for accepted/in progress
          case 'out_for_delivery':
            return '#f59e0b'; // Yellow for out for delivery
          case 'delivered':
            return '#6b7280'; // Gray for delivered
          default:
            return '#f97316'; // Orange for default/pending
        }
      };

      const statusColor = getStatusColor(order.status);
      
      // Create bigger, status-aware order marker
      const orderIcon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" fill="${statusColor}" stroke="white" stroke-width="3"/>
            <text x="24" y="30" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${index + 1}</text>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(48, 48),
        anchor: new window.google.maps.Point(24, 24)
      };

      // Create marker
      const marker = new window.google.maps.Marker({
        position: {
          lat: order.customer.coordinates.latitude,
          lng: order.customer.coordinates.longitude
        },
        map: mapInstance.current,
        icon: orderIcon,
        title: `Stop ${index + 1}: ${order.orderId}`,
        zIndex: 100
      });

      // Add info window with consistent styling
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 200px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${statusColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${index + 1}</div>
              <h3 style="font-weight: 600; color: #1f2937; margin: 0;">${order.orderId}</h3>
            </div>
            <div style="font-size: 14px; line-height: 1.5;">
              <p style="margin: 4px 0; color: #4b5563;"><strong style="color: #1f2937;">Customer:</strong> ${order.customer.name}</p>
              <p style="margin: 4px 0; color: #4b5563;"><strong style="color: #1f2937;">Address:</strong> ${order.customer.address}</p>
              <p style="margin: 4px 0; color: #4b5563;"><strong style="color: #1f2937;">Amount:</strong> <span style="font-weight: 500; color: #16a34a;">$${order.totalAmount.toFixed(2)}</span></p>
              <p style="margin: 4px 0; color: #4b5563;"><strong style="color: #1f2937;">Status:</strong> <span style="font-weight: 500; color: #ea580c;">${formatStatus(order.status)}</span></p>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Close any existing info window
        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }
        // Open order info window and set as active
        infoWindow.open(mapInstance.current, marker);
        activeInfoWindowRef.current = infoWindow;
        setSelectedOrder(order);
      });

      markersRef.current.push(marker);
    });

  }, [orders, mapLoaded]);

  // Set initial bounds only once when map loads and has data
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || hasSetBounds.current) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    let hasMarkers = false;

    // Add rider location to bounds if available
    if (rider.currentLocation) {
      bounds.extend({
        lat: rider.currentLocation.latitude,
        lng: rider.currentLocation.longitude
      });
      hasMarkers = true;
    }
    
    // Add order locations to bounds
    orders.forEach(order => {
      if (order.customer.coordinates) {
        bounds.extend({
          lat: order.customer.coordinates.latitude,
          lng: order.customer.coordinates.longitude
        });
        hasMarkers = true;
      }
    });
    
    if (hasMarkers) {
      console.log('Setting initial bounds to show all markers');
      mapInstance.current.fitBounds(bounds, { padding: 80 });
      hasSetBounds.current = true;
    }

  }, [mapLoaded, rider.currentLocation, orders]);

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="h-full flex flex-col lg:flex-row rounded-lg overflow-hidden border">
      {/* Map */}
      <div className="flex-1 relative min-h-[400px] lg:min-h-0">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Map Legend */}
        <Card className="absolute top-2 right-2 shadow-lg border-0 bg-background/95 backdrop-blur">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Route className="h-3 w-3 text-primary" />
              <h4 className="font-semibold text-xs">Map Legend</h4>
            </div>
            <div className="space-y-1.5 text-xs">
              {/* Rider Legend */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="text-[8px]">🚚</span>
                </div>
                <span className="text-muted-foreground font-medium">{rider.name}</span>
              </div>
              
              {/* Order Status Legend */}
              <div className="pt-1 border-t border-muted">
                <div className="text-[10px] font-medium text-muted-foreground mb-1">Order Status:</div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-muted-foreground">Assigned to Delivery</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">Accepted by Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-muted-foreground">Delivered</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Route Summary */}
        {orders.length > 0 && (
          <Card className="absolute bottom-2 left-2 shadow-lg border-0 bg-background/95 backdrop-blur">
            <CardContent className="p-2">
              <div className="flex items-center gap-2 text-xs">
                <Package className="h-3 w-3 text-primary" />
                <span className="font-medium">{orders.length} stops</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      
    </div>
    {/* Responsive Orders Sidebar */}
      <div className="w-full bg-background border-t lg:border-t-0 lg:border-l">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="font-semibold text-sm">Delivery Queue</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {orders.length}
          </Badge>
        </div>
        
        <ScrollArea className="h-[300px] lg:h-[calc(100vh-8rem)]">
          <div className="p-3 space-y-2">
            {orders.map((order, index) => (
              <Card 
                key={order._id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  selectedOrder?._id === order._id ? 'ring-1 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    {/* Order Number Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-md bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{order.orderId}</p>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {formatStatus(order.status)}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-1">{order.customer.name}</p>
                      
                      {/* Order Details */}
                      <div className="space-y-1">
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{order.customer.address}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {orders.length === 0 && (
              <Card className="border-dashed border-2">
                <CardContent className="p-4 text-center">
                  <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-xs font-medium text-muted-foreground">No active deliveries</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
      </>
  );
};

export default RiderTrackingMap;
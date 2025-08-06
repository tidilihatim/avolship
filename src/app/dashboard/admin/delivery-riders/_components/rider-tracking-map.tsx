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

interface LocationHistory {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

interface RiderTrackingMapProps {
  rider: DeliveryRider;
  orders: Order[];
  locationHistory?: LocationHistory[];
  showLocationHistory?: boolean;
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
  orders,
  locationHistory = [],
  showLocationHistory = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const riderMarkerRef = useRef<any>(null);
  const activeInfoWindowRef = useRef<any>(null);
  const locationHistoryPathRef = useRef<any>(null);
  const locationHistoryMarkersRef = useRef<any[]>([]);
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
    if (!mapLoaded || !mapInstance.current || !rider.currentLocation) {
      return;
    }

    // Validate coordinates
    const lat = rider.currentLocation.latitude;
    const lng = rider.currentLocation.longitude;
    
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng) || 
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return;
    }

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
        lat: lat,
        lng: lng
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
      lat: lat,
      lng: lng
    });

  }, [
    mapLoaded,
    rider.currentLocation?.latitude ?? null, 
    rider.currentLocation?.longitude ?? null, 
    rider.name, 
    rider.isAvailableForDelivery
  ]);

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

  // Update location history path and markers
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) {
      return;
    }

    // Clear existing location history elements
    if (locationHistoryPathRef.current) {
      locationHistoryPathRef.current.setMap(null);
      locationHistoryPathRef.current = null;
    }
    locationHistoryMarkersRef.current.forEach(marker => marker.setMap(null));
    locationHistoryMarkersRef.current = [];

    if (!showLocationHistory || !locationHistory.length) {
      return;
    }

    // Sort location history by timestamp
    const sortedHistory = [...locationHistory]
      .filter(loc => loc.latitude && loc.longitude)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (sortedHistory.length < 2) {
      return;
    }

    // Create path coordinates
    const pathCoordinates = sortedHistory.map(location => ({
      lat: location.latitude,
      lng: location.longitude
    }));

    // Create polyline path
    locationHistoryPathRef.current = new window.google.maps.Polyline({
      path: pathCoordinates,
      geodesic: true,
      strokeColor: '#6366f1',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: mapInstance.current
    });

    // Add markers for start and end points with timestamps
    const startPoint = sortedHistory[0];
    const endPoint = sortedHistory[sortedHistory.length - 1];

    // Start marker (green)
    const startMarker = new window.google.maps.Marker({
      position: { lat: startPoint.latitude, lng: startPoint.longitude },
      map: mapInstance.current,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      },
      title: `Start: ${new Date(startPoint.timestamp).toLocaleString()}`,
      zIndex: 999
    });

    // End marker (red)
    const endMarker = new window.google.maps.Marker({
      position: { lat: endPoint.latitude, lng: endPoint.longitude },
      map: mapInstance.current,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">E</text>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      },
      title: `End: ${new Date(endPoint.timestamp).toLocaleString()}`,
      zIndex: 999
    });

    // Add info windows for start and end points
    const startInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; min-width: 180px; background: white; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #10b981;"></div>
            <h3 style="font-weight: 600; color: #1f2937; margin: 0;">Route Start</h3>
          </div>
          <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">📅 ${new Date(startPoint.timestamp).toLocaleString()}</p>
          <p style="margin: 4px 0; color: #6b7280; font-size: 12px;">GPS: ${startPoint.accuracy ? `${startPoint.accuracy}m accuracy` : 'Unknown accuracy'}</p>
        </div>
      `
    });

    const endInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; min-width: 180px; background: white; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ef4444;"></div>
            <h3 style="font-weight: 600; color: #1f2937; margin: 0;">Route End</h3>
          </div>
          <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">📅 ${new Date(endPoint.timestamp).toLocaleString()}</p>
          <p style="margin: 4px 0; color: #6b7280; font-size: 12px;">GPS: ${endPoint.accuracy ? `${endPoint.accuracy}m accuracy` : 'Unknown accuracy'}</p>
        </div>
      `
    });

    startMarker.addListener('click', () => {
      if (activeInfoWindowRef.current) {
        activeInfoWindowRef.current.close();
      }
      startInfoWindow.open(mapInstance.current, startMarker);
      activeInfoWindowRef.current = startInfoWindow;
    });

    endMarker.addListener('click', () => {
      if (activeInfoWindowRef.current) {
        activeInfoWindowRef.current.close();
      }
      endInfoWindow.open(mapInstance.current, endMarker);
      activeInfoWindowRef.current = endInfoWindow;
    });

    locationHistoryMarkersRef.current.push(startMarker, endMarker);

  }, [locationHistory, showLocationHistory, mapLoaded]);

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

    // Add location history to bounds if shown
    if (showLocationHistory && locationHistory.length > 0) {
      locationHistory.forEach(location => {
        if (location.latitude && location.longitude) {
          bounds.extend({
            lat: location.latitude,
            lng: location.longitude
          });
          hasMarkers = true;
        }
      });
    }
    
    if (hasMarkers) {
      console.log('Setting initial bounds to show all markers');
      mapInstance.current.fitBounds(bounds, { padding: 80 });
      hasSetBounds.current = true;
    }

  }, [mapLoaded, rider.currentLocation, orders, showLocationHistory, locationHistory]);

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Check if rider has valid location data
  const hasValidLocation = rider.currentLocation && 
    typeof rider.currentLocation.latitude === 'number' && 
    typeof rider.currentLocation.longitude === 'number' &&
    !isNaN(rider.currentLocation.latitude) && 
    !isNaN(rider.currentLocation.longitude);

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

  if (!hasValidLocation) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No Location Data</p>
          <p className="text-sm text-muted-foreground">
            {rider.name} hasn't shared their location yet
          </p>
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

              {/* Location History Legend */}
              {showLocationHistory && locationHistory.length > 0 && (
                <div className="pt-1 border-t border-muted">
                  <div className="text-[10px] font-medium text-muted-foreground mb-1">Route History:</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-1 bg-indigo-500 rounded"></div>
                    <span className="text-muted-foreground">Path Traveled</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-500 text-white text-[6px] flex items-center justify-center font-bold">S</div>
                    <span className="text-muted-foreground">Route Start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 text-white text-[6px] flex items-center justify-center font-bold">E</div>
                    <span className="text-muted-foreground">Route End</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Route Summary */}
        {(orders.length > 0 || (showLocationHistory && locationHistory.length > 0)) && (
          <Card className="absolute bottom-2 left-2 shadow-lg border-0 bg-background/95 backdrop-blur">
            <CardContent className="p-2">
              <div className="space-y-1">
                {orders.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Package className="h-3 w-3 text-primary" />
                    <span className="font-medium">{orders.length} stops</span>
                  </div>
                )}
                {showLocationHistory && locationHistory.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-indigo-500" />
                    <span className="font-medium">{locationHistory.length} locations</span>
                  </div>
                )}
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
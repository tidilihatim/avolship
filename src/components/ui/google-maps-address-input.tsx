"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { MapPin, Search, Loader2, Maximize2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface GoogleMapsAddressInputProps {
  value?: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  required?: boolean;
}

// Google Maps component
interface GoogleMapComponentProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  onLocationChange: (location: Location) => void;
  initialAddress?: string;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  center,
  zoom,
  onLocationChange,
  initialAddress = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [marker, setMarker] = useState<google.maps.Marker>();
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder>();

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      const newGeocoder = new google.maps.Geocoder();
      setMap(newMap);
      setGeocoder(newGeocoder);
    }
  }, [center, zoom, map]);

  // Initialize marker
  useEffect(() => {
    if (map && !marker) {
      const newMarker = new google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: 'Drag to set exact location'
      });

      newMarker.addListener('dragend', () => {
        const position = newMarker.getPosition();
        if (position && geocoder) {
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              onLocationChange({
                latitude: position.lat(),
                longitude: position.lng(),
                address: results[0].formatted_address
              });
            }
          });
        }
      });

      setMarker(newMarker);
    }
  }, [map, marker, center, geocoder, onLocationChange]);

  // Update marker position when center changes
  useEffect(() => {
    if (marker && map) {
      marker.setPosition(center);
      map.setCenter(center);
    }
  }, [center, marker, map]);

  return (
    <div 
      ref={mapRef} 
      className="h-96 w-full rounded-md border border-input bg-background"
      style={{ minHeight: '384px' }}
    />
  );
};

// Fullscreen Map component
const FullscreenMapComponent: React.FC<{
  center: google.maps.LatLngLiteral;
  zoom: number;
  onLocationChange: (location: Location) => void;
}> = ({ center, zoom, onLocationChange }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [marker, setMarker] = useState<google.maps.Marker>();
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder>();

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      const newGeocoder = new google.maps.Geocoder();
      setMap(newMap);
      setGeocoder(newGeocoder);
    }
  }, [center, zoom, map]);

  // Initialize marker
  useEffect(() => {
    if (map && !marker) {
      const newMarker = new google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: 'Drag to set exact location'
      });

      newMarker.addListener('dragend', () => {
        const position = newMarker.getPosition();
        if (position && geocoder) {
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              onLocationChange({
                latitude: position.lat(),
                longitude: position.lng(),
                address: results[0].formatted_address
              });
            }
          });
        }
      });

      setMarker(newMarker);
    }
  }, [map, marker, center, geocoder, onLocationChange]);

  // Update marker position when center changes
  useEffect(() => {
    if (marker && map) {
      marker.setPosition(center);
      map.setCenter(center);
    }
  }, [center, marker, map]);

  return (
    <div 
      ref={mapRef} 
      className="h-full w-full rounded-md border border-input bg-background"
      style={{ minHeight: 'calc(90vh - 120px)' }}
    />
  );
};

// Render function for Google Maps wrapper
const renderMap = (status: Status): React.ReactElement => {
  if (status === Status.LOADING) {
    return (
      <div className="h-64 w-full rounded-md border border-input bg-muted/50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading map...
        </div>
      </div>
    );
  }

  if (status === Status.FAILURE) {
    return (
      <div className="h-64 w-full rounded-md border border-destructive bg-destructive/10 flex items-center justify-center">
        <div className="text-center text-destructive">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Failed to load Google Maps</p>
          <p className="text-xs">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  return <></>;
};

const GoogleMapsAddressInput: React.FC<GoogleMapsAddressInputProps> = ({
  value,
  onChange,
  placeholder = "Enter warehouse address...",
  label,
  error,
  className,
  required = false
}) => {
  const [address, setAddress] = useState(value?.address || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({
    lat: value?.latitude || 33.5889, // Default to Rabat, Morocco
    lng: value?.longitude || -7.6114
  });

  // Get Google Maps API key from environment
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Handle address search
  const handleAddressSearch = useCallback(() => {
    if (!address.trim() || !window.google) return;

    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: address.trim() }, (results, status) => {
      setIsSearching(false);
      
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        const newLocation = {
          latitude: location.lat(),
          longitude: location.lng(),
          address: results[0].formatted_address
        };

        setCenter({ lat: newLocation.latitude, lng: newLocation.longitude });
        setAddress(newLocation.address);
        onChange(newLocation);
      }
    });
  }, [address, onChange]);

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddressSearch();
    }
  };

  // Handle location change from map
  const handleLocationChange = useCallback((location: Location) => {
    setAddress(location.address);
    setCenter({ lat: location.latitude, lng: location.longitude });
    onChange(location);
  }, [onChange]);

  // Update internal state when value changes
  useEffect(() => {
    if (value) {
      setAddress(value.address);
      setCenter({ lat: value.latitude, lng: value.longitude });
    }
  }, [value]);

  if (!apiKey) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">{label}</Label>
        )}
        <Card className="p-4 border-destructive bg-destructive/10">
          <div className="text-center text-destructive">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Google Maps API key not configured</p>
            <p className="text-xs mt-1">
              Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables
            </p>
          </div>
        </Card>
        <Input
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            onChange({
              latitude: 0,
              longitude: 0,
              address: e.target.value
            });
          }}
          placeholder={placeholder}
          className={error ? "border-destructive" : ""}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="space-y-3">
        {/* Address Input */}
        <div className="flex gap-2">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={error ? "border-destructive" : ""}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddressSearch}
            disabled={isSearching || !address.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Google Maps */}
        <div className="relative">
          <Wrapper 
            apiKey={apiKey} 
            render={renderMap}
            libraries={['places']}
          >
            <GoogleMapComponent
              center={center}
              zoom={15}
              onLocationChange={handleLocationChange}
              initialAddress={address}
            />
          </Wrapper>
          
          {/* Fullscreen Button */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 shadow-md"
            onClick={() => setIsModalOpen(true)}
            title="Open in fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Fullscreen Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="flex items-center justify-between">
                <span>Select Warehouse Location</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsModalOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 p-4 pt-0">
              {/* Address Search in Modal */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddressSearch}
                    disabled={isSearching || !address.trim()}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search
                  </Button>
                </div>
              </div>

              {/* Fullscreen Map */}
              <div className="h-[calc(90vh-120px)]">
                <Wrapper 
                  apiKey={apiKey} 
                  render={(status: Status) => {
                    if (status === Status.LOADING) {
                      return (
                        <div className="h-full w-full rounded-md border border-input bg-muted/50 flex items-center justify-center">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading map...
                          </div>
                        </div>
                      );
                    }
                    if (status === Status.FAILURE) {
                      return (
                        <div className="h-full w-full rounded-md border border-destructive bg-destructive/10 flex items-center justify-center">
                          <div className="text-center text-destructive">
                            <MapPin className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Failed to load Google Maps</p>
                            <p className="text-xs">Please check your API key configuration</p>
                          </div>
                        </div>
                      );
                    }
                    return <></>;
                  }}
                  libraries={['places']}
                >
                  <FullscreenMapComponent
                    center={center}
                    zoom={15}
                    onLocationChange={handleLocationChange}
                  />
                </Wrapper>
              </div>

              {/* Location Info in Modal */}
              {value && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {value.address}
                    </p>
                    <p className="text-xs">
                      Coordinates: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Location Info */}
        {value && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>📍 {value.address}</p>
            <p>🌍 {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default GoogleMapsAddressInput;
export type { Location };
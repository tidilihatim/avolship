'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Activity, MapPin, Clock } from 'lucide-react';
import { getRiderLocationHistory } from '@/app/actions/user';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

// Hooks
import { useDeliveryRiders, DeliveryRider } from './_hooks/useDeliveryRiders';
import { useRiderSocket } from './_hooks/useRiderSocket';

// Components
import { RidersStats } from './_components/riders-stats';
import { RidersFiltersComponent } from './_components/riders-filters';
import { RidersList } from './_components/riders-list';
import { RidersPaginationComponent } from './_components/riders-pagination';

// Interfaces
interface LocationHistory {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

// Dynamic imports
const RiderTrackingMap = dynamic(() => import('./_components/rider-tracking-map'), {
  ssr: false,
  loading: () => {
    const LoadingComponent = () => {
      const t = useTranslations('deliveryRiders');
      return <div className="flex items-center justify-center h-96">{t('loadingMap')}</div>;
    };
    return <LoadingComponent />;
  }
});

export default function DeliveryRidersPage() {
  const t = useTranslations('deliveryRiders');
  const [selectedRider, setSelectedRider] = useState<DeliveryRider | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [trackRiderHistory, setTrackRiderHistory] = useState(false);
  const [riderLocationHistory, setRiderLocationHistory] = useState<LocationHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Data management
  const {
    riders,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    refetch,
    updateRider,
    addRider
  } = useDeliveryRiders();

  const { isConnected } = useRiderSocket({ riders, updateRider, addRider });

  // Location history functions
  const fetchRiderLocationHistory = useCallback(async (riderId: string) => {
    setIsLoadingHistory(true);
    try {
      const result = await getRiderLocationHistory(riderId);
      if (result.success) {
        setRiderLocationHistory(result.locationHistory);
      } else {
        console.error('Failed to fetch location history:', result.message);
        setRiderLocationHistory([]);
      }
    } catch (error) {
      console.error('Error fetching location history:', error);
      setRiderLocationHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleTrackRiderHistoryToggle = useCallback(async (checked: boolean) => {
    setTrackRiderHistory(checked);
    
    if (checked && selectedRider) {
      await fetchRiderLocationHistory(selectedRider.id);
    } else {
      setRiderLocationHistory([]);
    }
  }, [selectedRider, fetchRiderLocationHistory]);

  // Event handlers
  const handleTrackRider = useCallback(async (rider: DeliveryRider) => {
    try {
      const token = await fetch('/api/auth/token').then(res => res.json());
      
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
          const freshRiderData = {
            ...rider,
            ...result.data,
            currentLocation: result.data.currentLocation ? {
              ...result.data.currentLocation,
              timestamp: new Date(result.data.currentLocation.timestamp)
            } : undefined,
            assignedOrders: result.data.assignedOrders || [],
            deliveryStats: result.data.deliveryStats || {}
          };
          
          setSelectedRider(freshRiderData);
          setShowMap(true);
        }
      }
    } catch (error) {
      console.error('Error fetching rider details:', error);
      setSelectedRider(rider);
      setShowMap(true);
    }
  }, []);

  const handleBackToList = useCallback(() => {
    setShowMap(false);
    setSelectedRider(null);
    setTrackRiderHistory(false);
    setRiderLocationHistory([]);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPage(page);
  }, [setPage]);

  const handleLimitChange = useCallback((limit: number) => {
    // Reset to first page when changing limit
    setPage(1);
    // Update pagination limit - this would need to be implemented in the hook
    // For now, refetch with new params
    refetch();
  }, [setPage, refetch]);

  // Calculate stats
  const onlineCount = riders.filter(r => r.isOnline).length;
  const availableCount = riders.filter(r => r.isOnline && r.isAvailableForDelivery).length;

  // Show tracking view
  if (showMap && selectedRider) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToRiders')}
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Badge className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                selectedRider.isOnline ? 'bg-primary' : 'bg-destructive'
              }`} />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">{selectedRider.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={selectedRider.isOnline ? "default" : "secondary"}>
                  {selectedRider.isOnline ? t('online') : t('offline')}
                </Badge>
                {selectedRider.isOnline && (
                  <Badge variant={selectedRider.isAvailableForDelivery ? "default" : "outline"}>
                    {selectedRider.isAvailableForDelivery ? t('available') : t('busy')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <Card className="p-3">
              <div className="flex items-center space-x-3">
                <Label htmlFor="track-history-admin" className="text-sm font-medium">
                  {t('trackRiderHistory')}
                </Label>
                <Switch
                  id="track-history-admin"
                  checked={trackRiderHistory}
                  onCheckedChange={handleTrackRiderHistoryToggle}
                  disabled={isLoadingHistory || !selectedRider}
                />
                {trackRiderHistory && (
                  <Badge variant="secondary" className="ml-2">
                    {t('locationsCount', { count: riderLocationHistory.length })}
                  </Badge>
                )}
              </div>
              {trackRiderHistory && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('showingLastRecords', { name: selectedRider?.name })}
                </p>
              )}
            </Card>
            
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {isConnected ? t('liveTracking') : t('disconnected')}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Badge className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{t('activeOrders')}</p>
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
                <Badge className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{t('todaysDeliveries')}</p>
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
                  <p className="text-sm font-medium">{t('gpsAccuracy')}</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedRider.currentLocation?.accuracy ? 
                      `${selectedRider.currentLocation.accuracy.toFixed(0)}m` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t('realTimeTracking')}
              {selectedRider.currentLocation && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {t('locationLabel')} {new Date(selectedRider.currentLocation.timestamp).toLocaleString()}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedRider.isOnline ? 
                t('liveTrackingDescription', { name: selectedRider.name }) :
                t('offlineTrackingDescription', { name: selectedRider.name })
              }
            </p>
          </CardHeader>
          
          <CardContent className="p-0">
            <div style={{ height: '600px' }}>
              <RiderTrackingMap 
                rider={selectedRider}
                orders={selectedRider.assignedOrders || []}
                locationHistory={trackRiderHistory ? riderLocationHistory : []}
                showLocationHistory={trackRiderHistory}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show main riders list
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        
        <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {isConnected ? t('connected') : t('disconnected')}
        </Badge>
      </div>

      {/* Stats */}
      <RidersStats riders={riders} totalRiders={pagination.totalRiders} />

      {/* Filters */}
      <RidersFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        totalRiders={pagination.totalRiders}
        onlineCount={onlineCount}
        availableCount={availableCount}
      />

      {/* Riders List */}
      <RidersList
        riders={riders}
        loading={loading}
        error={error}
        onTrackRider={handleTrackRider}
      />

      {/* Pagination */}
      <RidersPaginationComponent
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}
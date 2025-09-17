'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAccessToken } from '@/app/actions/cookie';

export interface DeliveryRider {
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

export interface RidersFilters {
  status: 'all' | 'online' | 'offline';
  availability: 'all' | 'available' | 'busy';
  search: string;
}

export interface RidersPagination {
  currentPage: number;
  totalPages: number;
  totalRiders: number;
  limit: number;
}

interface UseDeliveryRidersResult {
  riders: DeliveryRider[];
  loading: boolean;
  error: string | null;
  pagination: RidersPagination;
  filters: RidersFilters;
  setFilters: (filters: Partial<RidersFilters>) => void;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
  updateRider: (riderId: string, updates: Partial<DeliveryRider>) => void;
  addRider: (rider: DeliveryRider) => void;
}

const DEFAULT_FILTERS: RidersFilters = {
  status: 'all',
  availability: 'all',
  search: ''
};

const DEFAULT_PAGINATION: RidersPagination = {
  currentPage: 1,
  totalPages: 1,
  totalRiders: 0,
  limit: 10
};

export const useDeliveryRiders = (): UseDeliveryRidersResult => {
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<RidersPagination>(DEFAULT_PAGINATION);
  const [filters, setFiltersState] = useState<RidersFilters>(DEFAULT_FILTERS);

  const fetchRiders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        throw new Error('No auth token found');
      }

      const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
      const queryParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        available: filters.availability,
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${API_URL}/api/admin/delivery-riders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const processedRiders = result.data.riders.map((rider: any) => ({
          ...rider,
          currentLocation: rider.currentLocation ? {
            ...rider.currentLocation,
            timestamp: new Date(rider.currentLocation.timestamp)
          } : undefined,
          lastActive: rider.lastActive ? new Date(rider.lastActive) : undefined
        }));

        setRiders(processedRiders);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.message || 'Failed to fetch riders');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching riders:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters]);

  const setFilters = useCallback((newFilters: Partial<RidersFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const refetch = useCallback(async () => {
    await fetchRiders();
  }, [fetchRiders]);

  const updateRider = useCallback((riderId: string, updates: Partial<DeliveryRider>) => {
    setRiders(prevRiders => 
      prevRiders.map(rider => 
        rider.id === riderId ? { ...rider, ...updates } : rider
      )
    );
  }, []);

  const addRider = useCallback((rider: DeliveryRider) => {
    setRiders(prevRiders => {
      // Check if rider already exists
      const existingRiderIndex = prevRiders.findIndex(r => r.id === rider.id);
      if (existingRiderIndex >= 0) {
        // Update existing rider
        return prevRiders.map((r, index) => 
          index === existingRiderIndex ? rider : r
        );
      } else {
        // Add new rider
        return [...prevRiders, rider];
      }
    });
  }, []);

  // Initial fetch and when dependencies change
  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  return {
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
  };
};
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Activity, Truck } from 'lucide-react';
import { DeliveryRider } from '../_hooks/useDeliveryRiders';

interface RidersStatsProps {
  riders: DeliveryRider[];
  totalRiders: number;
}

export const RidersStats: React.FC<RidersStatsProps> = ({ riders, totalRiders }) => {
  const onlineRiders = riders.filter(rider => rider.isOnline);
  const availableRiders = onlineRiders.filter(rider => rider.isAvailableForDelivery);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRiders}</div>
          <p className="text-xs text-muted-foreground">
            All registered delivery riders
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online Now</CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{onlineRiders.length}</div>
          <p className="text-xs text-muted-foreground">
            Currently connected riders
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available for Delivery</CardTitle>
          <Truck className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{availableRiders.length}</div>
          <p className="text-xs text-muted-foreground">
            Ready to accept new orders
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

interface DeliveryDashboardClientProps {
  children: React.ReactNode;
}

export const DeliveryDashboardClient: React.FC<DeliveryDashboardClientProps> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleDateRangeChange = (range: string) => {
    if (range === 'custom') {
      return; // Don't navigate for custom, wait for date inputs
    }

    const params = new URLSearchParams(searchParams);
    
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (range) {
      case 'today':
        startDate = now.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'this_week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'this_month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'last_30_days':
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = last30.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      default:
        startDate = now.toISOString().split('T')[0];
        endDate = startDate;
    }

    params.set('startDate', startDate);
    params.set('endDate', endDate);
    router.push(`/dashboard/delivery?${params.toString()}`);
  };

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      const params = new URLSearchParams(searchParams);
      params.set('startDate', customStartDate);
      params.set('endDate', customEndDate);
      router.push(`/dashboard/delivery?${params.toString()}`);
    }
  };

  const getCurrentRange = (): string => {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!startDate || !endDate) return 'today';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    // Check if it's today
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    if (start.toISOString().split('T')[0] === today.toISOString().split('T')[0] && 
        end.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
      return 'today';
    }
    
    // Check other ranges
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (daysDiff) {
      case 0:
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (start.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
          return 'yesterday';
        }
        return 'today';
      case 6:
      case 7:
        return 'this_week';
      case 29:
      case 30:
        return 'last_30_days';
      default:
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (start.toISOString().split('T')[0] === monthStart.toISOString().split('T')[0]) {
          return 'this_month';
        }
        return 'custom';
    }
  };

  const currentRange = getCurrentRange();

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Select value={currentRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Custom Date Range Inputs */}
            {currentRange === 'custom' && (
              <div className="flex items-end gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <Button 
                  onClick={handleCustomDateSubmit}
                  disabled={!customStartDate || !customEndDate}
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {children}
    </div>
  );
};
'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import { DateRangeFilter } from '@/components/call-center/date-range-filter';

interface Rider {
  _id: string;
  name: string;
  email: string;
  country: string;
}

interface AdminDeliveryDashboardClientProps {
  children: React.ReactNode;
  riders: Rider[];
}

export const AdminDeliveryDashboardClient: React.FC<AdminDeliveryDashboardClientProps> = ({
  children,
  riders,
}) => {
  const t = useTranslations('adminDeliveryDashboard');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    router.push(`/dashboard/admin/delivery?${params.toString()}`, { scroll: false });
  };

  const handleRiderChange = (riderId: string) => {
    const params = new URLSearchParams(searchParams);
    if (riderId === 'all') {
      params.delete('riderId');
    } else {
      params.set('riderId', riderId);
    }
    router.push(`/dashboard/admin/delivery?${params.toString()}`, { scroll: false });
  };

  const getCurrentRange = () => {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) return 'today';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    if (start.getTime() === today.getTime() && end.getDate() === todayEnd.getDate()) {
      return 'today';
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    switch (daysDiff) {
      case 0:
        return 'today';
      case 2:
        return 'last3days';
      case 6:
        return 'last7days';
      case 29:
        return 'last30days';
      default:
        return 'custom';
    }
  };

  const selectedRider = searchParams.get('riderId') || 'all';

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Date Range Filter (for future charts) */}
        <DateRangeFilter onDateRangeChange={handleDateRangeChange} defaultRange={getCurrentRange()} />

        {/* Rider Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              {t('riderFilter.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRider} onValueChange={handleRiderChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('riderFilter.selectRider')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('riderFilter.allRiders')}</SelectItem>
                {riders.map((rider) => (
                  <SelectItem key={rider._id} value={rider._id}>
                    {rider.name} ({rider.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedRider === 'all'
                ? t('riderFilter.showingAll', { count: riders.length })
                : t('riderFilter.showingOne', {
                    name: riders.find((r) => r._id === selectedRider)?.name || '',
                  })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Content */}
      {children}
    </div>
  );
};

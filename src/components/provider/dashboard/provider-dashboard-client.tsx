'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CalendarDays } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProviderDashboardClientProps {
  children: React.ReactNode;
}

export function ProviderDashboardClient({ children }: ProviderDashboardClientProps) {
  const t = useTranslations('providerDashboard.filters');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    const filter = searchParams.get('filter');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    if (filter) {
      setDateFilter(filter);
    }
    if (start) {
      setCustomStartDate(start);
    }
    if (end) {
      setCustomEndDate(end);
    }
  }, [searchParams]);

  const handleFilterChange = (filter: string) => {
    setDateFilter(filter);
    
    if (filter !== 'custom') {
      const params = new URLSearchParams();
      params.set('filter', filter);
      router.push(`?${params.toString()}`);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      const params = new URLSearchParams();
      params.set('filter', 'custom');
      params.set('start', customStartDate);
      params.set('end', customEndDate);
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('today')}
              >
                <CalendarDays className="w-4 h-4 mr-1" />
                {t('today')}
              </Button>
              <Button
                variant={dateFilter === 'this_week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('this_week')}
              >
                {t('thisWeek')}
              </Button>
              <Button
                variant={dateFilter === 'this_month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('this_month')}
              >
                {t('thisMonth')}
              </Button>
              <Button
                variant={dateFilter === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('custom')}
              >
                <Calendar className="w-4 h-4 mr-1" />
                {t('customRange')}
              </Button>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex gap-2 items-end">
                <div className="space-y-1">
                  <Label htmlFor="start-date" className="text-xs">{t('from')}</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end-date" className="text-xs">{t('to')}</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-36"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleCustomDateApply}
                  disabled={!customStartDate || !customEndDate}
                >
                  {t('apply')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {children}
    </div>
  );
}
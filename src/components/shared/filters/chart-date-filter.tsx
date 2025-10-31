'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export type DatePeriod = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export interface ChartDateFilterProps {
  period: DatePeriod;
  startDate?: Date;
  endDate?: Date;
  onPeriodChange: (period: DatePeriod) => void;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

export function ChartDateFilter({
  period,
  startDate,
  endDate,
  onPeriodChange,
  onDateRangeChange,
  className
}: ChartDateFilterProps) {
  const t = useTranslations('callCenterDashboard.dateFilter');
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handlePeriodChange = (newPeriod: DatePeriod) => {
    onPeriodChange(newPeriod);
    if (newPeriod === 'custom') {
      setIsCustomOpen(true);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      onDateRangeChange(tempStartDate, tempEndDate);
      setIsCustomOpen(false);
    }
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsCustomOpen(false);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('selectRange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{t('today')}</SelectItem>
            <SelectItem value="yesterday">{t('yesterday')}</SelectItem>
            <SelectItem value="this_week">{t('thisWeek')}</SelectItem>
            <SelectItem value="this_month">{t('thisMonth')}</SelectItem>
            <SelectItem value="this_year">{t('thisYear')}</SelectItem>
            <SelectItem value="custom">{t('customRange')}</SelectItem>
          </SelectContent>
        </Select>

        {period === 'custom' && (
          <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate && endDate ? (
                  <>
                    {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                  </>
                ) : (
                  <span>{t('selectCustomRange')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('startDate')}</label>
                  <Calendar
                    mode="single"
                    selected={tempStartDate}
                    onSelect={setTempStartDate}
                    disabled={(date) =>
                      date > new Date() || (tempEndDate ? date > tempEndDate : false)
                    }
                    initialFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('endDate')}</label>
                  <Calendar
                    mode="single"
                    selected={tempEndDate}
                    onSelect={setTempEndDate}
                    disabled={(date) =>
                      date > new Date() || (tempStartDate ? date < tempStartDate : false)
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancel} size="sm">
                    {t('cancel')}
                  </Button>
                  <Button
                    onClick={handleApplyCustomRange}
                    disabled={!tempStartDate || !tempEndDate}
                    size="sm"
                  >
                    {t('applyRange')}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

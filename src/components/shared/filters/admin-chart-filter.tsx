'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartDateFilter, DatePeriod } from './chart-date-filter';

export interface CallCenterUser {
  _id: string;
  name: string;
  email: string;
}

export interface AdminChartFilterProps {
  period: DatePeriod;
  startDate?: Date;
  endDate?: Date;
  selectedUserId: string;
  callCenterUsers: CallCenterUser[];
  onPeriodChange: (period: DatePeriod) => void;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  onUserChange: (userId: string) => void;
  className?: string;
}

export function AdminChartFilter({
  period,
  startDate,
  endDate,
  selectedUserId,
  callCenterUsers,
  onPeriodChange,
  onDateRangeChange,
  onUserChange,
  className
}: AdminChartFilterProps) {
  const t = useTranslations('callCenterDashboard.charts.totalCallsMade');

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className || ''}`}>
      {/* Call Center User Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Call Center Agent:</label>
        <Select value={selectedUserId} onValueChange={onUserChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {callCenterUsers.map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter */}
      <ChartDateFilter
        period={period}
        startDate={startDate}
        endDate={endDate}
        onPeriodChange={onPeriodChange}
        onDateRangeChange={onDateRangeChange}
      />
    </div>
  );
}

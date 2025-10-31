'use client';

import React, { useState } from 'react';
import { AdminChartFilter, CallCenterUser } from '@/components/shared/filters/admin-chart-filter';
import { DatePeriod } from '@/components/shared/filters/chart-date-filter';
import { AdminTotalCallsMadeWrapper } from '@/components/admin/call-center/charts/total-calls-made-wrapper';
import { AdminConfirmationRateWrapper } from '@/components/admin/call-center/charts/confirmation-rate-wrapper';
import { AdminAverageCallDurationWrapper } from '@/components/admin/call-center/charts/average-call-duration-wrapper';
import { AdminAgentPerformanceRankingWrapper } from '@/components/admin/call-center/charts/agent-performance-ranking-wrapper';
import { AdminFollowUpCallsWrapper } from '@/components/admin/call-center/charts/follow-up-calls-wrapper';

export interface AdminCallCenterClientProps {
  initialCallCenterUsers: CallCenterUser[];
}

export function AdminCallCenterClient({ initialCallCenterUsers }: AdminCallCenterClientProps) {
  const [period, setPeriod] = useState<DatePeriod>('today');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setPeriod('custom');
  };

  return (
    <div className="space-y-6">
      {/* Global Admin Filter */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
        <AdminChartFilter
          period={period}
          startDate={startDate}
          endDate={endDate}
          selectedUserId={selectedUserId}
          callCenterUsers={initialCallCenterUsers}
          onPeriodChange={setPeriod}
          onDateRangeChange={handleDateRangeChange}
          onUserChange={setSelectedUserId}
        />
      </div>

      {/* Charts Section - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance Ranking */}
        <AdminAgentPerformanceRankingWrapper
          period={period}
          startDate={startDate}
          endDate={endDate}
        />

        {/* Total Calls Made Chart */}
        <AdminTotalCallsMadeWrapper
          period={period}
          startDate={startDate}
          endDate={endDate}
          selectedUserId={selectedUserId}
        />

        {/* Confirmation Rate Chart */}
        <AdminConfirmationRateWrapper
          period={period}
          startDate={startDate}
          endDate={endDate}
          selectedUserId={selectedUserId}
        />

        {/* Average Call Duration Chart */}
        <AdminAverageCallDurationWrapper
          period={period}
          startDate={startDate}
          endDate={endDate}
          selectedUserId={selectedUserId}
        />

        {/* Follow-up Calls Required Chart */}
        <AdminFollowUpCallsWrapper
          period={period}
          startDate={startDate}
          endDate={endDate}
          selectedUserId={selectedUserId}
        />
      </div>
    </div>
  );
}

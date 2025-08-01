'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DateRangeFilter } from './date-range-filter'

interface CallCenterDashboardClientProps {
  children: React.ReactNode
}

export const CallCenterDashboardClient: React.FC<CallCenterDashboardClientProps> = ({ children }) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('startDate', startDate)
    params.set('endDate', endDate)
    router.push(`/dashboard/call_center?${params.toString()}`)
  }

  const getCurrentRange = () => {
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (!startDate || !endDate) return 'today'
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()
    
    // Check if it's today
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    
    if (start.getTime() === today.getTime() && end.getDate() === todayEnd.getDate()) {
      return 'today'
    }
    
    // Check other ranges
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    switch (daysDiff) {
      case 0: return 'today'
      case 2: return 'last3days'
      case 6: return 'last7days'
      case 29: return 'last30days'
      default: return 'custom'
    }
  }

  return (
    <div className="space-y-6">
      <DateRangeFilter 
        onDateRangeChange={handleDateRangeChange}
        defaultRange={getCurrentRange()}
      />
      {children}
    </div>
  )
}
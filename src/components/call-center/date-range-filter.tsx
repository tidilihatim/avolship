'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import { format } from 'date-fns'

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void
  defaultRange?: string
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateRangeChange,
  defaultRange = 'today'
}) => {
  const t = useTranslations('callCenterDashboard.dateFilter')
  const [selectedRange, setSelectedRange] = useState(defaultRange)
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  const getDateRange = (range: string) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now)

    switch (range) {
      case 'today':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'yesterday':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'last3days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 2)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'last7days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'last30days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 29)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'thisweek':
        const today = now.getDay()
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - today)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'thismonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), 11, 31)
        endDate.setHours(23, 59, 59, 999)
        break
      default:
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }

  const handleRangeChange = (range: string) => {
    setSelectedRange(range)
    if (range === 'custom') {
      setShowCustomDatePicker(true)
      return
    }
    const { startDate, endDate } = getDateRange(range)
    onDateRangeChange(startDate, endDate)
  }

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999)
      
      onDateRangeChange(startDate.toISOString(), endDate.toISOString())
      setShowCustomDatePicker(false)
    }
  }

  const formatDateRange = (range: string) => {
    if (range === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'MMM dd, yyyy')} - ${format(customEndDate, 'MMM dd, yyyy')}`
    }
    
    const { startDate, endDate } = getDateRange(range)
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (range === 'today') {
      return start.toLocaleDateString()
    }
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString()
    }
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="w-5 h-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <Select value={selectedRange} onValueChange={handleRangeChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t('selectRange')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t('today')}</SelectItem>
                <SelectItem value="yesterday">{t('yesterday')}</SelectItem>
                <SelectItem value="last3days">{t('last3Days')}</SelectItem>
                <SelectItem value="last7days">{t('last7Days')}</SelectItem>
                <SelectItem value="last30days">{t('last30Days')}</SelectItem>
                <SelectItem value="thisweek">{t('thisWeek')}</SelectItem>
                <SelectItem value="thismonth">{t('thisMonth')}</SelectItem>
                <SelectItem value="thisyear">{t('thisYear')}</SelectItem>
                <SelectItem value="custom">{t('customRange')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDateRange(selectedRange)}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRangeChange(selectedRange)}
          >
            {t('refresh')}
          </Button>
        </div>

        {/* Custom Date Range Picker */}
        {showCustomDatePicker && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex flex-col gap-4">
              <h4 className="font-medium flex items-center gap-2">
                <CalendarRange className="w-4 h-4" />
                {t('selectCustomRange')}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('startDate')}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, 'PPP') : t('pickStartDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        disabled={(date) => {
                          if (date > new Date()) return true
                          if (customEndDate && date > customEndDate) return true
                          return false
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('endDate')}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, 'PPP') : t('pickEndDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        disabled={(date) => {
                          if (date > new Date()) return true
                          if (customStartDate && date < customStartDate) return true
                          return false
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomDatePicker(false)
                    setSelectedRange('today')
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleCustomDateApply}
                  disabled={!customStartDate || !customEndDate}
                >
                  {t('applyRange')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
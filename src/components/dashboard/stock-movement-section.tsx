'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";
import { getStockMovementChartData } from "@/app/actions/stock-history";
import { StockMovementChart } from "./stock-movement-chart";

interface StockMovementSectionProps {
  productId: string;
  selectedWarehouseId?: string;
}

export default function StockMovementSection({ productId, selectedWarehouseId }: StockMovementSectionProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      const result = await getStockMovementChartData(
        productId,
        selectedDateRange,
        selectedWarehouseId,
        selectedDateRange === 'custom' ? customStartDate : undefined,
        selectedDateRange === 'custom' ? customEndDate : undefined
      );
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        console.error('Failed to load stock movement data:', result.message);
        setData([]);
      }
    } catch (error) {
      console.error('Error loading stock movement data:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDateRange === 'custom' && customStartDate && customEndDate) {
      loadChartData();
    } else if (selectedDateRange !== 'custom') {
      loadChartData();
    }
  }, [productId, selectedDateRange, selectedWarehouseId, customStartDate, customEndDate]);

  const dateRangeOptions = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "this_week" },
    { label: "This Month", value: "this_month" },
    { label: "This Year", value: "this_year" },
    { label: "Custom Range", value: "custom" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Stock Movement Analysis</CardTitle>
            <CardDescription>
              Track stock in and out movements over time
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Filter */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range Inputs */}
            {selectedDateRange === 'custom' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="start-date" className="text-sm">From:</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="end-date" className="text-sm">To:</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <StockMovementChart data={data} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
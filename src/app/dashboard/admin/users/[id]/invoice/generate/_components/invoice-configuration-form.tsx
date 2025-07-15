'use client';

import React from 'react';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';

interface Warehouse {
  _id: string;
  name: string;
  country: string;
  currency: string;
}

interface InvoiceConfiguration {
  startDate: string;
  endDate: string;
  warehouseId: string;
  fees: {
    confirmationFee: number;
    serviceFee: number;
    warehouseFee: number;
    shippingFee: number;
    processingFee: number;
    expeditionFee: number;
  };
  notes: string;
  terms: string;
}

interface InvoiceConfigurationFormProps {
  configuration: InvoiceConfiguration;
  setConfiguration: React.Dispatch<React.SetStateAction<InvoiceConfiguration>>;
  warehouses: Warehouse[];
  warehousesLoading: boolean;
  onPreview: () => void;
  previewLoading: boolean;
  error: string | null;
}

export default function InvoiceConfigurationForm({
  configuration,
  setConfiguration,
  warehouses,
  warehousesLoading,
  onPreview,
  previewLoading,
  error,
}: InvoiceConfigurationFormProps) {
  const updateConfiguration = (updates: Partial<InvoiceConfiguration>) => {
    setConfiguration(prev => ({ ...prev, ...updates }));
  };

  const updateFees = (feeUpdates: Partial<InvoiceConfiguration['fees']>) => {
    setConfiguration(prev => ({
      ...prev,
      fees: { ...prev.fees, ...feeUpdates }
    }));
  };

  const calculateTotalFees = () => {
    return Object.values(configuration.fees).reduce((sum, fee) => sum + fee, 0);
  };

  const selectedWarehouse = warehouses.find(w => w._id === configuration.warehouseId);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Date Range and Warehouse */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date *</Label>
            <DatePicker
              id="start-date"
              date={configuration.startDate ? new Date(configuration.startDate) : undefined}
              onDateChange={(date) => updateConfiguration({ startDate: date ? date.toISOString().split('T')[0] : '' })}
              placeholder="Select start date"
              maxDate={new Date()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date *</Label>
            <DatePicker
              id="end-date"
              date={configuration.endDate ? new Date(configuration.endDate) : undefined}
              onDateChange={(date) => updateConfiguration({ endDate: date ? date.toISOString().split('T')[0] : '' })}
              placeholder="Select end date"
              minDate={configuration.startDate ? new Date(configuration.startDate) : undefined}
              maxDate={new Date()}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="warehouse">Warehouse *</Label>
          <Select 
            value={configuration.warehouseId} 
            onValueChange={(value) => updateConfiguration({ warehouseId: value })}
            disabled={warehousesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={warehousesLoading ? "Loading..." : "Select warehouse"} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse._id} value={warehouse._id}>
                  {warehouse.name} ({warehouse.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Fee Configuration */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Fee Configuration</Label>
          <p className="text-sm text-muted-foreground">
            Configure the fees to be deducted from the seller's payment
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation-fee">Confirmation Fee</Label>
            <Input
              id="confirmation-fee"
              type="number"
              min="0"
              step="0.01"
              value={configuration.fees.confirmationFee}
              onChange={(e) => updateFees({ confirmationFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-fee">Service Fee</Label>
            <Input
              id="service-fee"
              type="number"
              min="0"
              step="0.01"
              value={configuration.fees.serviceFee}
              onChange={(e) => updateFees({ serviceFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouse-fee">Warehouse Fee</Label>
            <Input
              id="warehouse-fee"
              type="number"
              min="0"
              step="0.01"
              value={configuration.fees.warehouseFee}
              onChange={(e) => updateFees({ warehouseFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping-fee">Shipping Fee</Label>
            <Input
              id="shipping-fee"
              type="number"
              min="0"
              step="0.01"
              value={configuration.fees.shippingFee}
              onChange={(e) => updateFees({ shippingFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="processing-fee">Processing Fee</Label>
            <Input
              id="processing-fee"
              type="number"
              min="0"
              step="0.01"
              value={configuration.fees.processingFee}
              onChange={(e) => updateFees({ processingFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expedition-fee">Expedition Fee</Label>
            <Input
              id="expedition-fee"
              type="number"
              min="0"
              step="0.01"
              value={configuration.fees.expeditionFee}
              onChange={(e) => updateFees({ expeditionFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Total Fees</Label>
            <div className="p-2 bg-muted rounded-md text-sm font-medium border">
              {formatCurrency(calculateTotalFees(), selectedWarehouse?.currency || 'USD')}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Notes and Terms */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Invoice Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes for this invoice..."
            value={configuration.notes}
            onChange={(e) => updateConfiguration({ notes: e.target.value })}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms">Terms & Conditions</Label>
          <Textarea
            id="terms"
            placeholder="Payment terms and conditions..."
            value={configuration.terms}
            onChange={(e) => updateConfiguration({ terms: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <Separator />

      {/* Preview Button */}
      <div className="space-y-4">
        <Button
          onClick={onPreview}
          disabled={previewLoading || !configuration.startDate || !configuration.endDate || !configuration.warehouseId}
          className="w-full"
          size="lg"
        >
          {previewLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating Preview...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Generate Preview
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
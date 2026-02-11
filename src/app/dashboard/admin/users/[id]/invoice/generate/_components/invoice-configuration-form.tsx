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
import { DebtInvoiceConfiguration, PAYMENT_METHODS, AFRICAN_CURRENCIES } from '@/types/debt-invoice';
import { Checkbox } from '@/components/ui/checkbox';
import CustomFeesManager from './custom-fees-manager';
import ExpeditionManager from './expedition-manager';
import OrderManager from './order-manager';
import PreviousDebtSelector from './previous-debt-selector';

interface Warehouse {
  _id: string;
  name: string;
  country: string;
  currency: string;
}

interface InvoiceConfigurationFormProps {
  configuration: DebtInvoiceConfiguration;
  setConfiguration: React.Dispatch<React.SetStateAction<DebtInvoiceConfiguration>>;
  warehouses: Warehouse[];
  warehousesLoading: boolean;
  onPreview: () => void;
  previewLoading: boolean;
  error: string | null;
  sellerId: string; // Added for previous debt functionality
}

export default function InvoiceConfigurationForm({
  configuration,
  setConfiguration,
  warehouses,
  warehousesLoading,
  onPreview,
  previewLoading,
  error,
  sellerId,
}: InvoiceConfigurationFormProps) {
  const updateConfiguration = (updates: Partial<DebtInvoiceConfiguration>) => {
    setConfiguration(prev => ({ ...prev, ...updates }));
  };

  const updateFees = (feeUpdates: Partial<DebtInvoiceConfiguration['fees']>) => {
    setConfiguration(prev => ({
      ...prev,
      fees: { ...prev.fees, ...feeUpdates }
    }));
  };

  const calculateTotalFees = () => {
    const legacyFees = Object.values(configuration.fees).reduce((sum, fee) => sum + fee, 0);
    const customFees = configuration.customFees.reduce((sum, fee) => sum + fee.amount, 0);
    return legacyFees + customFees;
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
              date={configuration.startDate ? new Date(configuration.startDate + 'T00:00:00') : undefined}
              onDateChange={(date) => {
                if (date) {
                  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                  updateConfiguration({ startDate: localDate.toISOString().split('T')[0] });
                } else {
                  updateConfiguration({ startDate: '' });
                }
              }}
              placeholder="Select start date"
              maxDate={new Date()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date *</Label>
            <DatePicker
              id="end-date"
              date={configuration.endDate ? new Date(configuration.endDate + 'T00:00:00') : undefined}
              onDateChange={(date) => {
                if (date) {
                  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                  updateConfiguration({ endDate: localDate.toISOString().split('T')[0] });
                } else {
                  updateConfiguration({ endDate: '' });
                }
              }}
              placeholder="Select end date"
              minDate={configuration.startDate ? new Date(configuration.startDate + 'T00:00:00') : undefined}
              maxDate={new Date()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse">Warehouse *</Label>
            <Select
              value={configuration.warehouseId}
              onValueChange={(value) => {
                const selectedWarehouse = warehouses.find(w => w._id === value);
                updateConfiguration({
                  warehouseId: value,
                  currencyConversion: {
                    ...configuration.currencyConversion,
                    fromCurrency: selectedWarehouse?.currency || 'USD'
                  }
                });
              }}
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

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select
              value={configuration.paymentMethod}
              onValueChange={(value) => updateConfiguration({ paymentMethod: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Currency Conversion */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Currency Conversion</Label>
          <p className="text-sm text-muted-foreground">
            Convert final amounts to different currency for seller view
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="enable-conversion"
            checked={configuration.currencyConversion.enabled}
            onCheckedChange={(checked) =>
              updateConfiguration({
                currencyConversion: {
                  ...configuration.currencyConversion,
                  enabled: checked as boolean
                }
              })
            }
          />
          <Label htmlFor="enable-conversion">Enable Currency Conversion</Label>
        </div>

        {configuration.currencyConversion.enabled && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Currency (from Warehouse)</Label>
                <div className="p-2 bg-background border rounded-md text-sm font-medium">
                  {configuration.currencyConversion.fromCurrency || selectedWarehouse?.currency || 'Select warehouse first'}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-currency">Convert To *</Label>
                <Select
                  value={configuration.currencyConversion.toCurrency}
                  onValueChange={(value) =>
                    updateConfiguration({
                      currencyConversion: {
                        ...configuration.currencyConversion,
                        toCurrency: value
                      }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {AFRICAN_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex flex-col">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-xs text-muted-foreground">{currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversion-rate">Exchange Rate *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap">1 {configuration.currencyConversion.fromCurrency || 'BASE'} =</span>
                <Input
                  id="conversion-rate"
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder="1.0000"
                  className="max-w-32"
                  value={configuration.currencyConversion.rate}
                  onChange={(e) =>
                    updateConfiguration({
                      currencyConversion: {
                        ...configuration.currencyConversion,
                        rate: parseFloat(e.target.value) || 1
                      }
                    })
                  }
                />
                <span className="text-sm font-medium whitespace-nowrap">{configuration.currencyConversion.toCurrency || 'TARGET'}</span>
              </div>
              {configuration.currencyConversion.toCurrency && (
                <p className="text-xs text-muted-foreground">
                  Example: If 1 {configuration.currencyConversion.fromCurrency} equals {configuration.currencyConversion.rate} {configuration.currencyConversion.toCurrency}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Custom Fees Management */}
      <CustomFeesManager
        fees={configuration.customFees}
        onFeesChange={(fees) => updateConfiguration({ customFees: fees })}
        currency={selectedWarehouse?.currency || 'USD'}
      />

      <Separator />

      {/* Legacy Fee Configuration */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Standard Fees (Legacy)</Label>
          <p className="text-sm text-muted-foreground">
            These are the legacy fee fields. Use Custom Fees above for new fees.
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
            <Label className="text-sm font-medium">Total Legacy Fees</Label>
            <div className="p-2 bg-muted rounded-md text-sm font-medium border">
              {formatCurrency(Object.values(configuration.fees).reduce((sum, fee) => sum + fee, 0), selectedWarehouse?.currency || 'USD')}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>Grand Total (Legacy + Custom):</span>
            <span className="text-lg font-semibold text-primary">
              {formatCurrency(calculateTotalFees(), selectedWarehouse?.currency || 'USD')}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Order Selection */}
      <OrderManager
        orders={configuration.manualOrders}
        onOrdersChange={(orders) => updateConfiguration({ manualOrders: orders })}
        currency={selectedWarehouse?.currency || 'USD'}
        sellerId={sellerId}
        warehouseId={configuration.warehouseId}
        startDate={configuration.startDate}
        endDate={configuration.endDate}
      />

      <Separator />

      {/* Expedition Selection */}
      <ExpeditionManager
        expeditions={configuration.manualExpeditions}
        onExpeditionsChange={(expeditions) => updateConfiguration({ manualExpeditions: expeditions })}
        currency={selectedWarehouse?.currency || 'USD'}
        sellerId={sellerId}
        warehouseId={configuration.warehouseId}
        startDate={configuration.startDate}
        endDate={configuration.endDate}
      />

      <Separator />

      {/* Previous Debt Selection */}
      <PreviousDebtSelector
        sellerId={sellerId}
        warehouseId={configuration.warehouseId}
        includePreviousDebt={configuration.includePreviousDebt}
        selectedDebts={configuration.selectedPreviousDebts}
        onToggleDebtInclusion={(enabled) => updateConfiguration({ includePreviousDebt: enabled })}
        onDebtSelectionChange={(selectedDebts) => updateConfiguration({ selectedPreviousDebts: selectedDebts })}
        currency={selectedWarehouse?.currency || 'USD'}
      />

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
          disabled={previewLoading || !configuration.startDate || !configuration.endDate || !configuration.warehouseId || !configuration.paymentMethod}
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
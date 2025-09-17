'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Settings2, Loader2 } from 'lucide-react';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { CurrencySettings, commonCurrencies } from '@/types/warehouse';

interface WarehouseSettingsProps {
  warehouseCurrency: string;
  currentSettings: CurrencySettings;
  onUpdate: (data: CurrencySettings) => Promise<void>;
}

/**
 * WarehouseSettings Component
 * Dialog for updating currency conversion settings
 */
export default function WarehouseSettings({
  warehouseCurrency,
  currentSettings,
  onUpdate,
}: WarehouseSettingsProps) {
  const t = useTranslations('warehouse');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for form values
  const [enabled, setEnabled] = useState(currentSettings.enabled);
  const [targetCurrency, setTargetCurrency] = useState(currentSettings.targetCurrency);
  const [rate, setRate] = useState(currentSettings.rate);
  const [autoUpdate, setAutoUpdate] = useState(currentSettings.autoUpdate);
  
  /**
   * Validate the currency settings before submitting
   */
  const validateSettings = (): Record<string, string> => {
    const validationErrors: Record<string, string> = {};
    
    if (enabled) {
      if (!targetCurrency) {
        validationErrors.targetCurrency = 'Target currency is required';
      } else if (targetCurrency === warehouseCurrency) {
        validationErrors.targetCurrency = 'Target currency must be different from warehouse currency';
      }
      
      if (rate <= 0) {
        validationErrors.rate = 'Conversion rate must be positive';
      }
    }
    
    return validationErrors;
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateSettings();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Show first error as toast
      const firstError = Object.values(validationErrors)[0];
      toast(firstError);
      
      return;
    }
    
    // Clear errors if validation passed
    setErrors({});
    setIsSubmitting(true);
    
    try {
      await onUpdate({
        enabled,
        targetCurrency,
        rate,
        autoUpdate,
      });
      
      setIsOpen(false);
    } catch (error) {
      toast(t('messages.error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Reset form to current settings
   */
  const resetForm = () => {
    setEnabled(currentSettings.enabled);
    setTargetCurrency(currentSettings.targetCurrency);
    setRate(currentSettings.rate);
    setAutoUpdate(currentSettings.autoUpdate);
    setErrors({});
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Settings2 className="mr-2 h-4 w-4" />
          {t('details.currencySettings')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('details.currencySettings')}</DialogTitle>
          <DialogDescription>
            {t('form.currencyConversion')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="enabled">
                {enabled ? t('details.enabled') : t('details.disabled')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('form.conversionEnabledDescription')}
              </p>
            </div>
          </div>
          
          {enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="targetCurrency">{t('form.targetCurrency')}</Label>
                <Select
                  value={targetCurrency}
                  onValueChange={setTargetCurrency}
                >
                  <SelectTrigger 
                    id="targetCurrency"
                    className={errors.targetCurrency ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select target currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonCurrencies
                      .filter(currency => currency.code !== warehouseCurrency)
                      .map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name} ({currency.symbol})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t('form.targetCurrencyDescription')}
                </p>
                {errors.targetCurrency && (
                  <p className="text-sm text-destructive">{errors.targetCurrency}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rate">{t('form.conversionRate')}</Label>
                <Input 
                  id="rate"
                  type="number" 
                  step="0.0001"
                  placeholder="e.g., 1.2345" 
                  className={errors.rate ? 'border-destructive' : ''}
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  1 {warehouseCurrency} = {rate} {targetCurrency}
                </p>
                {errors.rate && (
                  <p className="text-sm text-destructive">{errors.rate}</p>
                )}
              </div>
              
              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <Switch
                  id="autoUpdate"
                  checked={autoUpdate}
                  onCheckedChange={setAutoUpdate}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="autoUpdate">
                    {autoUpdate ? t('details.enabled') : t('details.disabled')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('form.autoUpdateRateDescription')}
                  </p>
                </div>
              </div>
            </>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              {t('form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t('form.saving') : t('form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
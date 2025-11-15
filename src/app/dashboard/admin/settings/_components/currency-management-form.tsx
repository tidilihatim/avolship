"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rates: { [currencyCode: string]: number };
  isActive: boolean;
}

interface CurrencyManagementFormProps {
  currencies: Currency[];
  onCurrenciesChange: (currencies: Currency[]) => void;
}

export function CurrencyManagementForm({ currencies, onCurrenciesChange }: CurrencyManagementFormProps) {
  const t = useTranslations('settings.currencies');
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newCurrency, setNewCurrency] = useState<Currency>({
    code: '',
    name: '',
    symbol: '',
    rates: {},
    isActive: true,
  });

  const handleAddCurrency = () => {
    if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }

    // Check if currency code already exists
    if (currencies.some(c => c.code.toUpperCase() === newCurrency.code.toUpperCase())) {
      toast.error(t('validation.currencyExists'));
      return;
    }

    // Add reciprocal rates for all existing currencies
    const updatedCurrencies = [...currencies];
    const rates: { [key: string]: number } = {};

    updatedCurrencies.forEach(currency => {
      rates[currency.code] = 1; // Default rate, admin needs to update
    });

    const currencyToAdd = {
      ...newCurrency,
      code: newCurrency.code.toUpperCase(),
      rates,
    };

    onCurrenciesChange([...updatedCurrencies, currencyToAdd]);

    setNewCurrency({
      code: '',
      name: '',
      symbol: '',
      rates: {},
      isActive: true,
    });
    setIsAdding(false);
    toast.success(t('messages.currencyAdded'));
  };

  const handleRemoveCurrency = (index: number) => {
    const currencyToRemove = currencies[index];
    const updatedCurrencies = currencies.filter((_, i) => i !== index);

    // Remove the currency code from all other currencies' rates
    updatedCurrencies.forEach(currency => {
      delete currency.rates[currencyToRemove.code];
    });

    onCurrenciesChange(updatedCurrencies);
    toast.success(t('messages.currencyRemoved'));
  };

  const handleToggleCurrency = (index: number) => {
    const updatedCurrencies = [...currencies];
    updatedCurrencies[index].isActive = !updatedCurrencies[index].isActive;
    onCurrenciesChange(updatedCurrencies);
  };

  const handleUpdateRate = (currencyIndex: number, targetCurrencyCode: string, newRate: number) => {
    const updatedCurrencies = [...currencies];
    updatedCurrencies[currencyIndex].rates[targetCurrencyCode] = newRate;

    // Don't auto-calculate reciprocal - let admin set rates manually
    // This allows them to use exact rates from Google/other sources

    onCurrenciesChange(updatedCurrencies);
  };

  const formatRate = (rate: number): string => {
    // For very small numbers (< 0.01), show up to 6 decimals
    if (rate < 0.01) {
      return rate.toFixed(6).replace(/\.?0+$/, '');
    }
    // For small numbers (< 1), show up to 4 decimals
    if (rate < 1) {
      return rate.toFixed(4).replace(/\.?0+$/, '');
    }
    // For larger numbers, show 2 decimals
    return rate.toFixed(2).replace(/\.?0+$/, '');
  };

  const getConversionDisplay = (fromCurrency: Currency, toCurrencyCode: string) => {
    const rate = fromCurrency.rates[toCurrencyCode];
    if (!rate) return 'N/A';

    const toCurrency = currencies.find(c => c.code === toCurrencyCode);
    if (!toCurrency) return 'N/A';

    return `1 ${fromCurrency.symbol} = ${formatRate(rate)} ${toCurrency.symbol}`;
  };

  return (
    <div className="space-y-6">
      {/* Add New Currency Section */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('addNew.title')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>{t('addNew.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency-code">{t('fields.code')}</Label>
                <Input
                  id="currency-code"
                  placeholder="GNF"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency-name">{t('fields.name')}</Label>
                <Input
                  id="currency-name"
                  placeholder="Guinean Franc"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency-symbol">{t('fields.symbol')}</Label>
                <Input
                  id="currency-symbol"
                  placeholder="Fr"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                {t('addNew.cancel')}
              </Button>
              <Button onClick={handleAddCurrency}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addNew.add')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addNew.button')}
        </Button>
      )}

      {/* Existing Currencies */}
      {currencies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('noCurrencies')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {currencies.map((currency, index) => (
            <Card key={currency.code}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {currency.code}
                        <Badge variant={currency.isActive ? "default" : "secondary"}>
                          {currency.isActive ? t('status.active') : t('status.inactive')}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {currency.name} ({currency.symbol})
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={currency.isActive}
                      onCheckedChange={() => handleToggleCurrency(index)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCurrency(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <Label className="text-sm font-medium">
                        {t('exchangeRates.title')}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {t('exchangeRates.note')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {currencies
                        .filter(c => c.code !== currency.code)
                        .map(targetCurrency => (
                          <div key={targetCurrency.code} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              {t('exchangeRates.to')} {targetCurrency.code}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.000001"
                                value={currency.rates[targetCurrency.code] || 0}
                                onChange={(e) =>
                                  handleUpdateRate(
                                    index,
                                    targetCurrency.code,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="text-sm"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {getConversionDisplay(currency, targetCurrency.code)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>

                  {Object.keys(currency.rates).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t('exchangeRates.noRates')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* Exchange Rate Preview */}
      {currencies.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('preview.title')}</CardTitle>
            <CardDescription>{t('preview.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currencies.filter(c => c.isActive).map(fromCurrency => (
                <div key={fromCurrency.code} className="space-y-2">
                  <h4 className="font-medium text-sm">
                    {fromCurrency.code} ({fromCurrency.symbol})
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {currencies
                      .filter(c => c.code !== fromCurrency.code && c.isActive)
                      .map(toCurrency => (
                        <div key={toCurrency.code}>
                          • {getConversionDisplay(fromCurrency, toCurrency.code)}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

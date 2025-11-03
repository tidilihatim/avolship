"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus } from 'lucide-react';
import { WarehouseSelector } from './warehouse-selector';
import { formatPrice } from '@/lib/utils';

interface CallCenterCommissionRule {
  warehouseId: string;
  minDeliveries: number;
  maxDeliveries: number;
  commission: number;
  currency?: string; // For display purposes
}

interface CallCenterCommissionRulesFormProps {
  rules: CallCenterCommissionRule[];
  onRulesChange: (rules: CallCenterCommissionRule[]) => void;
}

export function CallCenterCommissionRulesForm({ rules, onRulesChange }: CallCenterCommissionRulesFormProps) {
  const t = useTranslations('settings.callCenterCommissionRules');
  const [newRule, setNewRule] = useState<Partial<CallCenterCommissionRule>>({
    minDeliveries: 1,
    maxDeliveries: 5,
    commission: 0,
  });

  const addRule = () => {
    if (!newRule.warehouseId || !newRule.minDeliveries || !newRule.maxDeliveries || !newRule.commission) {
      return;
    }

    if (newRule.minDeliveries >= newRule.maxDeliveries) {
      return;
    }

    const ruleToAdd: CallCenterCommissionRule = {
      warehouseId: newRule.warehouseId,
      minDeliveries: newRule.minDeliveries,
      maxDeliveries: newRule.maxDeliveries,
      commission: newRule.commission,
      currency: newRule.currency,
    };

    onRulesChange([...rules, ruleToAdd]);

    setNewRule({
      minDeliveries: 1,
      maxDeliveries: 5,
      commission: 0,
    });
  };

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    onRulesChange(updatedRules);
  };

  const updateRule = (index: number, field: keyof CallCenterCommissionRule, value: any) => {
    const updatedRules = rules.map((rule, i) =>
      i === index ? { ...rule, [field]: value } : rule
    );
    onRulesChange(updatedRules);
  };

  // Sort rules by warehouse for better organization
  const sortedRules = [...rules].sort((a, b) => {
    if (a.warehouseId === b.warehouseId) {
      return a.minDeliveries - b.minDeliveries;
    }
    return a.warehouseId.localeCompare(b.warehouseId);
  });

  // Create a map to get original indices for updates
  const getOriginalIndex = (sortedIndex: number) => {
    return rules.findIndex(rule => rule === sortedRules[sortedIndex]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Existing Rules */}
      {rules.length > 0 && (
        <div className="space-y-3">
          {sortedRules.map((rule, sortedIndex) => {
            const originalIndex = getOriginalIndex(sortedIndex);
            return (
              <Card key={originalIndex}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                      <Label>{t('labels.warehouse')}</Label>
                      <WarehouseSelector
                        value={rule.warehouseId}
                        onValueChange={(warehouseId, currency) => {
                          updateRule(originalIndex, 'warehouseId', warehouseId);
                          updateRule(originalIndex, 'currency', currency);
                        }}
                        placeholder={t('placeholders.selectWarehouse')}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`min-deliveries-${originalIndex}`}>{t('labels.minDeliveries')}</Label>
                      <Input
                        id={`min-deliveries-${originalIndex}`}
                        type="number"
                        min="0"
                        value={rule.minDeliveries}
                        onChange={(e) =>
                          updateRule(originalIndex, 'minDeliveries', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor={`max-deliveries-${originalIndex}`}>{t('labels.maxDeliveries')}</Label>
                      <Input
                        id={`max-deliveries-${originalIndex}`}
                        type="number"
                        min="1"
                        value={rule.maxDeliveries}
                        onChange={(e) =>
                          updateRule(originalIndex, 'maxDeliveries', parseInt(e.target.value) || 1)
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor={`commission-${originalIndex}`}>{t('labels.commission')}</Label>
                      <div className="space-y-1">
                        <Input
                          id={`commission-${originalIndex}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={rule.commission}
                          onChange={(e) =>
                            updateRule(originalIndex, 'commission', parseFloat(e.target.value) || 0)
                          }
                        />
                        {rule.currency && rule.commission > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {formatPrice(rule.commission, rule.currency)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeRule(originalIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Separator />

      {/* Add New Rule Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('addNew.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label>{t('labels.warehouse')}</Label>
              <WarehouseSelector
                value={newRule.warehouseId}
                onValueChange={(warehouseId, currency) => {
                  setNewRule(prev => ({ ...prev, warehouseId, currency }));
                }}
                placeholder={t('placeholders.selectWarehouse')}
              />
            </div>

            <div>
              <Label htmlFor="new-min-deliveries">{t('labels.minDeliveries')}</Label>
              <Input
                id="new-min-deliveries"
                type="number"
                min="0"
                value={newRule.minDeliveries || ''}
                onChange={(e) =>
                  setNewRule(prev => ({
                    ...prev,
                    minDeliveries: parseInt(e.target.value) || 0
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="new-max-deliveries">{t('labels.maxDeliveries')}</Label>
              <Input
                id="new-max-deliveries"
                type="number"
                min="1"
                value={newRule.maxDeliveries || ''}
                onChange={(e) =>
                  setNewRule(prev => ({
                    ...prev,
                    maxDeliveries: parseInt(e.target.value) || 1
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="new-commission">{t('labels.commission')}</Label>
              <div className="space-y-1">
                <Input
                  id="new-commission"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newRule.commission || ''}
                  onChange={(e) =>
                    setNewRule(prev => ({
                      ...prev,
                      commission: parseFloat(e.target.value) || 0
                    }))
                  }
                />
                {newRule.currency && newRule.commission && newRule.commission > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(newRule.commission, newRule.currency)}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Button
                onClick={addRule}
                className="w-full"
                disabled={!newRule.warehouseId || !newRule.minDeliveries || !newRule.maxDeliveries || !newRule.commission || (newRule.minDeliveries >= newRule.maxDeliveries)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.addRule')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

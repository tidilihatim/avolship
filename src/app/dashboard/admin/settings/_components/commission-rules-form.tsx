"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus } from 'lucide-react';
import { WarehouseSelector } from './warehouse-selector';
import { formatPrice } from '@/lib/utils';

interface CommissionRule {
  warehouseId: string;
  minDeliveries: number;
  commission: number;
  currency?: string; // For display purposes
}

interface CommissionRulesFormProps {
  rules: CommissionRule[];
  onRulesChange: (rules: CommissionRule[]) => void;
}

export function CommissionRulesForm({ rules, onRulesChange }: CommissionRulesFormProps) {
  const [newRule, setNewRule] = useState<Partial<CommissionRule>>({
    minDeliveries: 1,
    commission: 0,
  });

  const addRule = () => {
    if (!newRule.warehouseId || !newRule.minDeliveries || !newRule.commission) {
      return;
    }

    const ruleToAdd: CommissionRule = {
      warehouseId: newRule.warehouseId,
      minDeliveries: newRule.minDeliveries,
      commission: newRule.commission,
      currency: newRule.currency,
    };

    onRulesChange([...rules, ruleToAdd]);
    
    setNewRule({
      minDeliveries: 1,
      commission: 0,
    });
  };

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    onRulesChange(updatedRules);
  };

  const updateRule = (index: number, field: keyof CommissionRule, value: any) => {
    const updatedRules = rules.map((rule, i) => 
      i === index ? { ...rule, [field]: value } : rule
    );
    onRulesChange(updatedRules);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Commission Rules</h3>
        <p className="text-sm text-muted-foreground">
          Configure delivery-based commission rates for each warehouse
        </p>
      </div>

      {/* Existing Rules */}
      {rules.length > 0 && (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label>Warehouse</Label>
                    <WarehouseSelector
                      value={rule.warehouseId}
                      onValueChange={(warehouseId, currency) => {
                        updateRule(index, 'warehouseId', warehouseId);
                        updateRule(index, 'currency', currency);
                      }}
                      placeholder="Select warehouse"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`min-deliveries-${index}`}>Min Deliveries</Label>
                    <Input
                      id={`min-deliveries-${index}`}
                      type="number"
                      min="1"
                      value={rule.minDeliveries}
                      onChange={(e) => 
                        updateRule(index, 'minDeliveries', parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`commission-${index}`}>Commission</Label>
                    <div className="space-y-1">
                      <Input
                        id={`commission-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={rule.commission}
                        onChange={(e) => 
                          updateRule(index, 'commission', parseFloat(e.target.value) || 0)
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
                      onClick={() => removeRule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* Add New Rule Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New Commission Rule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Warehouse</Label>
              <WarehouseSelector
                value={newRule.warehouseId}
                onValueChange={(warehouseId, currency) => {
                  setNewRule(prev => ({ ...prev, warehouseId, currency }));
                }}
                placeholder="Select warehouse"
              />
            </div>
            
            <div>
              <Label htmlFor="new-min-deliveries">Min Deliveries</Label>
              <Input
                id="new-min-deliveries"
                type="number"
                min="1"
                value={newRule.minDeliveries || ''}
                onChange={(e) => 
                  setNewRule(prev => ({ 
                    ...prev, 
                    minDeliveries: parseInt(e.target.value) || 1 
                  }))
                }
              />
            </div>
            
            <div>
              <Label htmlFor="new-commission">Commission</Label>
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
                disabled={!newRule.warehouseId || !newRule.minDeliveries || !newRule.commission}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
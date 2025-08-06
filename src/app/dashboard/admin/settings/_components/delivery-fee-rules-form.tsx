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
import { toast } from 'sonner';

interface DeliveryFeeRule {
  warehouseId: string;
  minDistance: number;
  maxDistance: number;
  fee: number;
  currency?: string; // For display purposes
}

interface DeliveryFeeRulesFormProps {
  rules: DeliveryFeeRule[];
  onRulesChange: (rules: DeliveryFeeRule[]) => void;
}

export function DeliveryFeeRulesForm({ rules, onRulesChange }: DeliveryFeeRulesFormProps) {
  const [newRule, setNewRule] = useState<Partial<DeliveryFeeRule>>({
    minDistance: 0,
    maxDistance: 5,
    fee: 0,
  });

  // Helper function to check if ranges overlap
  const rangesOverlap = (min1: number, max1: number, min2: number, max2: number) => {
    // Two ranges overlap if: min1 <= max2 AND min2 <= max1
    // This includes boundary overlaps (e.g., 1-5 and 5-6 both include 5)
    return min1 <= max2 && min2 <= max1;
  };

  // Helper function to check for overlaps with existing rules
  const hasOverlapWithExisting = (warehouseId: string, minDistance: number, maxDistance: number, excludeIndex?: number) => {
    const warehouseRules = rules.filter((rule, index) => 
      rule.warehouseId === warehouseId && index !== excludeIndex
    );
    
    return warehouseRules.some(existingRule => 
      rangesOverlap(minDistance, maxDistance, existingRule.minDistance, existingRule.maxDistance)
    );
  };

  // Helper function to get overlapping rule details for better error messages
  const getOverlappingRule = (warehouseId: string, minDistance: number, maxDistance: number, excludeIndex?: number) => {
    const warehouseRules = rules.filter((rule, index) => 
      rule.warehouseId === warehouseId && index !== excludeIndex
    );
    
    return warehouseRules.find(existingRule => 
      rangesOverlap(minDistance, maxDistance, existingRule.minDistance, existingRule.maxDistance)
    );
  };

  // Helper function to get suggested min distance for a warehouse
  const getSuggestedMinDistance = (warehouseId: string) => {
    const warehouseRules = rules.filter(rule => rule.warehouseId === warehouseId);
    if (warehouseRules.length === 0) return 0;
    
    const maxDistances = warehouseRules.map(rule => rule.maxDistance);
    const highestMax = Math.max(...maxDistances);
    return Math.round((highestMax + 0.1) * 10) / 10;
  };

  // Update suggested min distance when warehouse changes
  const handleWarehouseChange = (warehouseId: string, currency: string) => {
    const suggestedMin = getSuggestedMinDistance(warehouseId);
    setNewRule(prev => ({ 
      ...prev, 
      warehouseId, 
      currency,
      minDistance: suggestedMin,
      maxDistance: suggestedMin + 5 // Suggest a reasonable range
    }));
  };

  const addRule = () => {
    if (!newRule.warehouseId || newRule.minDistance === undefined || !newRule.maxDistance || !newRule.fee) {
      return;
    }

    // Validate that minDistance is less than maxDistance
    if (newRule.minDistance >= newRule.maxDistance) {
      toast.error('Minimum distance must be less than maximum distance');
      return;
    }

    // Check for overlapping ranges
    const overlappingRule = getOverlappingRule(newRule.warehouseId, newRule.minDistance, newRule.maxDistance);
    if (overlappingRule) {
      toast.error(`Distance range ${newRule.minDistance}-${newRule.maxDistance} km overlaps with existing rule ${overlappingRule.minDistance}-${overlappingRule.maxDistance} km`);
      return;
    }

    const ruleToAdd: DeliveryFeeRule = {
      warehouseId: newRule.warehouseId,
      minDistance: newRule.minDistance,
      maxDistance: newRule.maxDistance,
      fee: newRule.fee,
      currency: newRule.currency,
    };

    onRulesChange([...rules, ruleToAdd]);
    
    setNewRule({
      minDistance: 0,
      maxDistance: 5,
      fee: 0,
    });
  };

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    onRulesChange(updatedRules);
  };

  const updateRule = (index: number, field: keyof DeliveryFeeRule, value: any) => {
    const updatedRules = rules.map((rule, i) => {
      if (i === index) {
        const updatedRule = { ...rule, [field]: value };
        
        // Validate that minDistance < maxDistance
        if (field === 'minDistance' && value >= rule.maxDistance) {
          toast.error('Minimum distance must be less than maximum distance');
          return rule; // Return original rule without changes
        }
        
        if (field === 'maxDistance' && rule.minDistance >= value) {
          toast.error('Maximum distance must be greater than minimum distance');
          return rule; // Return original rule without changes
        }
        
        // Check for overlapping ranges
        const newMin = field === 'minDistance' ? value : rule.minDistance;
        const newMax = field === 'maxDistance' ? value : rule.maxDistance;
        
        const overlappingRule = getOverlappingRule(rule.warehouseId, newMin, newMax, index);
        if (overlappingRule) {
          toast.error(`Distance range ${newMin}-${newMax} km overlaps with existing rule ${overlappingRule.minDistance}-${overlappingRule.maxDistance} km`);
          return rule; // Return original rule without changes
        }
        
        return updatedRule;
      }
      return rule;
    });
    onRulesChange(updatedRules);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Delivery Fee Rules</h3>
        <p className="text-sm text-muted-foreground">
          Configure distance-based delivery fees for each warehouse
        </p>
      </div>

      {/* Existing Rules */}
      {rules.length > 0 && (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <div className="flex items-end justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeRule(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`min-${index}`}>Min Distance (km)</Label>
                      <Input
                        id={`min-${index}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={rule.minDistance}
                        onChange={(e) => 
                          updateRule(index, 'minDistance', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`max-${index}`}>Max Distance (km)</Label>
                      <Input
                        id={`max-${index}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={rule.maxDistance}
                        onChange={(e) => 
                          updateRule(index, 'maxDistance', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`fee-${index}`}>Fee {rule.currency && `(${rule.currency})`}</Label>
                      <Input
                        id={`fee-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={rule.fee}
                        onChange={(e) => 
                          updateRule(index, 'fee', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
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
          <CardTitle className="text-sm">Add New Delivery Fee Rule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Warehouse</Label>
                <WarehouseSelector
                  value={newRule.warehouseId}
                  onValueChange={handleWarehouseChange}
                  placeholder="Select warehouse"
                />
                {newRule.warehouseId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Suggested range starts from: {getSuggestedMinDistance(newRule.warehouseId)} km (to avoid overlaps)
                  </p>
                )}
              </div>
              
              <div className="flex items-end justify-end">
                <Button 
                  onClick={addRule}
                  disabled={!newRule.warehouseId || !newRule.minDistance || !newRule.maxDistance || !newRule.fee}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-min">Min Distance (km)</Label>
                <Input
                  id="new-min"
                  type="number"
                  min="0"
                  step="0.1"
                  value={newRule.minDistance || ''}
                  onChange={(e) => 
                    setNewRule(prev => ({ 
                      ...prev, 
                      minDistance: parseFloat(e.target.value) || 0 
                    }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="new-max">Max Distance (km)</Label>
                <Input
                  id="new-max"
                  type="number"
                  min="0"
                  step="0.1"
                  value={newRule.maxDistance || ''}
                  onChange={(e) => 
                    setNewRule(prev => ({ 
                      ...prev, 
                      maxDistance: parseFloat(e.target.value) || 0 
                    }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="new-fee">Fee {newRule.currency && `(${newRule.currency})`}</Label>
                <Input
                  id="new-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newRule.fee || ''}
                  onChange={(e) => 
                    setNewRule(prev => ({ 
                      ...prev, 
                      fee: parseFloat(e.target.value) || 0 
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
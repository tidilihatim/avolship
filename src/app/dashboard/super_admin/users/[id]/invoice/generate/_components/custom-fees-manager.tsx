'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomFee } from '@/types/debt-invoice';

interface CustomFeesManagerProps {
  fees: CustomFee[];
  onFeesChange: (fees: CustomFee[]) => void;
  currency: string;
}

export default function CustomFeesManager({ fees, onFeesChange, currency }: CustomFeesManagerProps) {
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState<number>(0);

  const addCustomFee = () => {
    if (newFeeName.trim() && newFeeAmount > 0) {
      const newFee: CustomFee = {
        id: `custom-${Date.now()}`,
        name: newFeeName.trim(),
        amount: newFeeAmount
      };

      onFeesChange([...fees, newFee]);
      setNewFeeName('');
      setNewFeeAmount(0);
    }
  };

  const removeFee = (feeId: string) => {
    onFeesChange(fees.filter(fee => fee.id !== feeId));
  };

  const updateFee = (feeId: string, updates: Partial<CustomFee>) => {
    onFeesChange(fees.map(fee =>
      fee.id === feeId ? { ...fee, ...updates } : fee
    ));
  };

  const getTotalCustomFees = () => {
    return fees.reduce((total, fee) => total + fee.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Custom Fees</Label>
        <p className="text-sm text-muted-foreground">
          Add custom fees that will be included in debt calculation
        </p>
      </div>

      {/* Add New Fee Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Custom Fee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fee-name">Fee Name</Label>
              <Input
                id="fee-name"
                placeholder="e.g., Processing Fee"
                value={newFeeName}
                onChange={(e) => setNewFeeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-amount">Amount</Label>
              <Input
                id="fee-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newFeeAmount}
                onChange={(e) => setNewFeeAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={addCustomFee}
                disabled={!newFeeName.trim() || newFeeAmount <= 0}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Fee
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Custom Fees */}
      {fees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Custom Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fees.map((fee) => (
              <div key={fee.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <Input
                    value={fee.name}
                    onChange={(e) => updateFee(fee.id, { name: e.target.value })}
                    placeholder="Fee name"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fee.amount}
                    onChange={(e) => updateFee(fee.id, { amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFee(fee.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t font-medium">
              <span>Total Custom Fees:</span>
              <span>{formatCurrency(getTotalCustomFees())}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
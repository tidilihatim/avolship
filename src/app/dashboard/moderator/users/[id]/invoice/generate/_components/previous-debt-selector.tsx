'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PreviousDebt {
  invoiceId: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  debtAmount: number;
  currency: string;
  createdAt: string;
  status: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCurrency: string;
  isInvoiced: boolean;
}

interface PreviousDebtSelectorProps {
  sellerId: string;
  warehouseId: string;
  includePreviousDebt: boolean;
  selectedDebts: string[];
  onToggleDebtInclusion: (enabled: boolean) => void;
  onDebtSelectionChange: (selectedDebtIds: string[]) => void;
  currency: string;
}

import { getSellerUnpaidDebts, getAlreadyInvoicedItems } from '@/app/actions/debt-invoice';

export default function PreviousDebtSelector({
  sellerId,
  warehouseId,
  includePreviousDebt,
  selectedDebts,
  onToggleDebtInclusion,
  onDebtSelectionChange,
  currency
}: PreviousDebtSelectorProps) {
  const [debts, setDebts] = useState<PreviousDebt[]>([]);
  const [loading, setLoading] = useState(false);

  // Load previous debts when component mounts or seller/warehouse changes
  useEffect(() => {
    if (sellerId && warehouseId && includePreviousDebt) {
      loadPreviousDebts();
    }
  }, [sellerId, warehouseId, includePreviousDebt]);

  const loadPreviousDebts = async () => {
    setLoading(true);
    try {
      // First get already invoiced items to check which debts are already used
      const invoicedItemsResult = await getAlreadyInvoicedItems(sellerId);
      const invoicedDebtIds = invoicedItemsResult.success ? invoicedItemsResult.data?.debtIds || [] : [];

      // Then get unpaid debts with invoiced status
      const result = await getSellerUnpaidDebts(sellerId, warehouseId, invoicedDebtIds);
      if (result.success && result.data) {
        setDebts(result.data);
      } else {
        console.error('Failed to load debts:', result.message);
        setDebts([]);
      }
    } catch (error) {
      console.error('Error loading previous debts:', error);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDebtSelection = (debtId: string) => {
    const newSelection = selectedDebts.includes(debtId)
      ? selectedDebts.filter(id => id !== debtId)
      : [...selectedDebts, debtId];

    onDebtSelectionChange(newSelection);
  };

  const selectAllDebts = () => {
    // Select all debts (including already invoiced ones)
    onDebtSelectionChange(debts.map(debt => debt.invoiceId));
  };

  const clearAllDebts = () => {
    onDebtSelectionChange([]);
  };

  const getSelectedDebtsTotal = () => {
    return debts
      .filter(debt => selectedDebts.includes(debt.invoiceId))
      .reduce((total, debt) => {
        const amount = typeof debt.debtAmount === 'number' ? debt.debtAmount : 0;
        return total + Math.abs(amount);
      }, 0);
  };

  const getTotalUnpaidDebt = () => {
    return debts.reduce((total, debt) => {
      const amount = typeof debt.debtAmount === 'number' ? debt.debtAmount : 0;
      return total + Math.abs(amount);
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Previous Debt Management</Label>
        <p className="text-sm text-muted-foreground">
          Select which previous unpaid debts to include in this invoice
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="include-debt"
          checked={includePreviousDebt}
          onCheckedChange={onToggleDebtInclusion}
        />
        <Label htmlFor="include-debt">Include previous debt in calculation</Label>
      </div>

      {includePreviousDebt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Previous Unpaid Debts
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Total Outstanding: {formatCurrency(getTotalUnpaidDebt())}
              {debts.filter(debt => debt.isInvoiced).length > 0 && (
                <span className="text-orange-600">
                  ({debts.filter(debt => debt.isInvoiced).length} already invoiced)
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading previous debts...</span>
              </div>
            ) : debts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No previous unpaid debts found</p>
                  <p className="text-xs text-muted-foreground">This seller has a clean debt record!</p>
                </div>
              </div>
            ) : (
              <>
                {/* Bulk Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllDebts}
                    disabled={selectedDebts.length === debts.length}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllDebts}
                    disabled={selectedDebts.length === 0}
                  >
                    Clear All
                  </Button>
                  <div className="ml-auto text-sm text-muted-foreground">
                    {selectedDebts.length} of {debts.length} selected
                  </div>
                </div>

                <Separator />

                {/* Debt List */}
                <div className="space-y-3">
                  {debts.map((debt) => (
                    <div
                      key={debt.invoiceId}
                      className={`p-3 border rounded-lg transition-colors ${
                        selectedDebts.includes(debt.invoiceId)
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-background'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedDebts.includes(debt.invoiceId)}
                          onCheckedChange={() => toggleDebtSelection(debt.invoiceId)}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{debt.invoiceNumber}</span>
                            <Badge variant="secondary" className="text-xs">
                              {debt.status}
                            </Badge>
                            {debt.isInvoiced && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                Already Invoiced
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Period: {formatDate(debt.periodStart)} - {formatDate(debt.periodEnd)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {formatDate(debt.createdAt)}
                          </div>
                          {debt.isInvoiced && (
                            <div className="text-xs text-orange-600 font-medium">
                              ℹ️ This debt has been included in another invoice (can still be selected)
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-destructive">
                            {formatCurrency(Math.abs(typeof debt.debtAmount === 'number' ? debt.debtAmount : 0))}
                          </div>
                          <div className="text-xs text-muted-foreground">debt</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span>Selected Debt to Include:</span>
                    <span className="font-semibold text-destructive">
                      {formatCurrency(getSelectedDebtsTotal())}
                    </span>
                  </div>
                  {getSelectedDebtsTotal() > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This amount will be added to the invoice debt calculation
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
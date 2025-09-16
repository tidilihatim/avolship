'use client';

import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ManualExpedition } from '@/types/debt-invoice';
import { getSellerExpeditions, getAlreadyInvoicedItems } from '@/app/actions/debt-invoice';

interface AvailableExpedition {
  expeditionId: string;
  expeditionCode: string;
  weight: number;
  transportMode: string;
  fromCountry: string;
  expeditionDate: string;
  products: Array<{
    productName: string;
    productCode: string;
    quantity: number;
  }>;
  carrierInfo: { name: string } | null;
  status: string;
  isAlreadyInvoiced: boolean;
  previousInvoiceNumber?: string;
}

interface ExpeditionManagerProps {
  expeditions: ManualExpedition[];
  onExpeditionsChange: (expeditions: ManualExpedition[]) => void;
  currency: string;
  sellerId: string;
  warehouseId: string;
  startDate: string;
  endDate: string;
}

export default function ExpeditionManager({
  expeditions,
  onExpeditionsChange,
  currency,
  sellerId,
  warehouseId,
  startDate,
  endDate
}: ExpeditionManagerProps) {
  const [availableExpeditions, setAvailableExpeditions] = useState<AvailableExpedition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExpeditions, setSelectedExpeditions] = useState<string[]>([]);
  const [expeditionFees, setExpeditionFees] = useState<Record<string, number>>({});

  // Load available expeditions when date range or warehouse changes
  useEffect(() => {
    if (sellerId && warehouseId && startDate && endDate) {
      loadAvailableExpeditions();
    }
  }, [sellerId, warehouseId, startDate, endDate]);

  // Initialize selected expeditions from props
  useEffect(() => {
    if (expeditions.length > 0) {
      setSelectedExpeditions(expeditions.map(exp => exp.expeditionId));
      const fees: Record<string, number> = {};
      expeditions.forEach(exp => {
        fees[exp.expeditionId] = exp.feePerKg;
      });
      setExpeditionFees(fees);
    }
  }, [expeditions]);

  const loadAvailableExpeditions = async () => {
    setLoading(true);
    try {
      // Fetch both expeditions and already invoiced items
      const [expeditionsResult, invoicedResult] = await Promise.all([
        getSellerExpeditions(sellerId, warehouseId, startDate, endDate),
        getAlreadyInvoicedItems(sellerId)
      ]);

      if (expeditionsResult.success && expeditionsResult.data) {
        // Get set of already invoiced expedition IDs
        const invoicedExpeditionIds = new Set(
          invoicedResult.success ? invoicedResult.data?.expeditionIds || [] : []
        );

        // Transform expeditions to include invoice status information
        const transformedExpeditions = expeditionsResult.data.map((expedition: any) => {
          const isInvoiced = invoicedExpeditionIds.has(expedition.expeditionId || expedition._id);

          return {
            ...expedition,
            isAlreadyInvoiced: isInvoiced,
            previousInvoiceNumber: isInvoiced ? 'Previously Invoiced' : undefined,
          };
        });

        setAvailableExpeditions(transformedExpeditions);
      } else {
        console.error('Failed to load expeditions:', expeditionsResult.message);
        setAvailableExpeditions([]);
      }
    } catch (error) {
      console.error('Error loading expeditions:', error);
      setAvailableExpeditions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpeditionSelection = (expeditionId: string) => {
    const newSelected = selectedExpeditions.includes(expeditionId)
      ? selectedExpeditions.filter(id => id !== expeditionId)
      : [...selectedExpeditions, expeditionId];

    setSelectedExpeditions(newSelected);
    updateManualExpeditions(newSelected);
  };

  const updateExpeditionFee = (expeditionId: string, feePerKg: number) => {
    const newFees = { ...expeditionFees, [expeditionId]: feePerKg };
    setExpeditionFees(newFees);
    updateManualExpeditions(selectedExpeditions, newFees);
  };

  const updateManualExpeditions = (selected: string[] = selectedExpeditions, fees: Record<string, number> = expeditionFees) => {
    const manualExpeditions: ManualExpedition[] = selected.map(expeditionId => {
      const expedition = availableExpeditions.find(exp => exp.expeditionId === expeditionId);
      if (!expedition) return null;

      const feePerKg = fees[expeditionId] || 0;
      return {
        expeditionId,
        feePerKg,
        totalCost: expedition.weight * feePerKg,
      };
    }).filter(Boolean) as ManualExpedition[];

    onExpeditionsChange(manualExpeditions);
  };

  const getTotalExpeditionCosts = () => {
    return expeditions.reduce((total, exp) => total + exp.totalCost, 0);
  };

  const selectAllExpeditions = () => {
    setSelectedExpeditions(availableExpeditions.map(exp => exp.expeditionId));
    updateManualExpeditions(availableExpeditions.map(exp => exp.expeditionId));
  };

  const clearAllExpeditions = () => {
    setSelectedExpeditions([]);
    updateManualExpeditions([]);
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
        <Label className="text-base font-medium">Expedition Selection</Label>
        <p className="text-sm text-muted-foreground">
          Select delivered expeditions from the database and set fee per KG for debt calculation
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading available expeditions...</span>
          </CardContent>
        </Card>
      ) : availableExpeditions.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No delivered expeditions found for this period</p>
              <p className="text-xs text-muted-foreground">Try adjusting the date range</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Available Expeditions ({availableExpeditions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllExpeditions}
                disabled={selectedExpeditions.length === availableExpeditions.length}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllExpeditions}
                disabled={selectedExpeditions.length === 0}
              >
                Clear All
              </Button>
              <div className="ml-auto text-sm text-muted-foreground">
                {selectedExpeditions.length} of {availableExpeditions.length} selected
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableExpeditions.map((expedition) => (
              <div
                key={expedition.expeditionId}
                className={`p-4 border rounded-lg transition-colors ${
                  expedition.isAlreadyInvoiced
                    ? 'bg-destructive/5 border-destructive/20 opacity-75'
                    : selectedExpeditions.includes(expedition.expeditionId)
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-background'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedExpeditions.includes(expedition.expeditionId)}
                    onCheckedChange={() => toggleExpeditionSelection(expedition.expeditionId)}
                  />
                  <div className="flex-1 space-y-3">
                    {/* Expedition Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="font-medium text-sm">{expedition.expeditionCode}</div>
                        <div className="text-xs text-muted-foreground">
                          Date: {formatDate(expedition.expeditionDate)}
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {expedition.status}
                        </Badge>
                        {expedition.isAlreadyInvoiced && (
                          <Badge variant="destructive" className="text-xs mt-1 ml-1">
                            <Package className="h-3 w-3 mr-1" />
                            Previously Invoiced
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{expedition.weight} KG</div>
                        <div className="text-xs text-muted-foreground">
                          {expedition.transportMode} • {expedition.fromCountry}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Carrier: {expedition.carrierInfo?.name || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{expedition.products.length} Products</div>
                        <div className="text-xs text-muted-foreground">
                          {expedition.products.map(p => p.productName).join(', ').substring(0, 50)}...
                        </div>
                      </div>
                    </div>

                    {/* Fee Input */}
                    {selectedExpeditions.includes(expedition.expeditionId) && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div className="space-y-2">
                            <Label htmlFor={`fee-${expedition.expeditionId}`}>Fee per KG *</Label>
                            <Input
                              id={`fee-${expedition.expeditionId}`}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={expeditionFees[expedition.expeditionId] || ''}
                              onChange={(e) => updateExpeditionFee(expedition.expeditionId, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Total Cost</Label>
                            <div className="p-2 bg-primary/5 border border-primary/20 rounded-md text-sm font-medium">
                              {formatCurrency(expedition.weight * (expeditionFees[expedition.expeditionId] || 0))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {selectedExpeditions.length > 0 && (
              <>
                <Separator />
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>Total Selected Expedition Costs:</span>
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(getTotalExpeditionCosts())}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This amount will be charged to the seller as expedition fees
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
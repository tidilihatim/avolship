'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { Percent, Edit2, Trash2, AlertCircle, Settings } from 'lucide-react';
import { 
  getSellerDiscountSettings, 
  getSelectedWarehouseInfo, 
  updateDiscountSettings, 
  deleteDiscountSettings, 
  toggleDiscountSettings 
} from '@/app/actions/seller-settings';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DiscountSetting {
  warehouseId: string;
  warehouseName: string;
  maxDiscountPercentage: number;
  maxDiscountAmount?: number;
  isEnabled: boolean;
  updatedAt: string;
}

interface Warehouse {
  _id: string;
  name: string;
  currency: string;
  country: string;
}

export default function DiscountSettings() {
  const [isPending, startTransition] = useTransition();
  const [discountSetting, setDiscountSetting] = useState<DiscountSetting | null>(null);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWarehouseSelected, setHasWarehouseSelected] = useState(false);
  
  // Form state for editing/creating
  const [formData, setFormData] = useState({
    maxDiscountPercentage: 0,
    maxDiscountAmount: undefined as number | undefined,
    isEnabled: true,
  });
  
  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsResult, warehouseResult] = await Promise.all([
        getSellerDiscountSettings(),
        getSelectedWarehouseInfo()
      ]);
      
      if (warehouseResult.success) {
        setWarehouse(warehouseResult.data);
        setHasWarehouseSelected(true);
        
        if (settingsResult.success) {
          setDiscountSetting(settingsResult.data.discountSetting);
        }
      } else {
        setHasWarehouseSelected(false);
        toast.error(warehouseResult.message || 'No warehouse selected');
      }
    } catch (error) {
      toast.error('Failed to load discount settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form data
  const resetForm = () => {
    if (discountSetting) {
      setFormData({
        maxDiscountPercentage: discountSetting.maxDiscountPercentage,
        maxDiscountAmount: discountSetting.maxDiscountAmount,
        isEnabled: discountSetting.isEnabled,
      });
    } else {
      setFormData({
        maxDiscountPercentage: 0,
        maxDiscountAmount: undefined,
        isEnabled: true,
      });
    }
  };

  // Handle edit existing setting
  const handleEdit = () => {
    if (discountSetting) {
      setFormData({
        maxDiscountPercentage: discountSetting.maxDiscountPercentage,
        maxDiscountAmount: discountSetting.maxDiscountAmount,
        isEnabled: discountSetting.isEnabled,
      });
    }
    setIsEditing(true);
  };

  // Handle save (create or update)
  const handleSave = () => {
    if (formData.maxDiscountPercentage < 0 || formData.maxDiscountPercentage > 100) {
      toast.error('Discount percentage must be between 0 and 100');
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateDiscountSettings({
          maxDiscountPercentage: formData.maxDiscountPercentage,
          maxDiscountAmount: formData.maxDiscountAmount,
          isEnabled: formData.isEnabled,
        });

        if (result.success) {
          const settingData: DiscountSetting = {
            warehouseId: warehouse!._id,
            warehouseName: warehouse!.name,
            maxDiscountPercentage: formData.maxDiscountPercentage,
            maxDiscountAmount: formData.maxDiscountAmount,
            isEnabled: formData.isEnabled,
            updatedAt: new Date().toISOString(),
          };

          setDiscountSetting(settingData);
          
          if (discountSetting) {
            toast.success('Discount settings updated successfully');
          } else {
            toast.success('Discount settings created successfully');
          }

          // Reset form and close dialog
          resetForm();
          setIsEditing(false);
        } else {
          toast.error(result.message || 'Failed to save discount settings');
        }
      } catch (error) {
        toast.error('Failed to save discount settings');
      }
    });
  };

  // Handle delete setting
  const handleDelete = () => {
    if (!discountSetting) return;
    
    startTransition(async () => {
      try {
        const result = await deleteDiscountSettings();
        
        if (result.success) {
          setDiscountSetting(null);
          toast.success('Discount settings removed');
        } else {
          toast.error(result.message || 'Failed to delete discount settings');
        }
      } catch (error) {
        toast.error('Failed to delete discount settings');
      }
    });
  };

  // Handle toggle enabled/disabled
  const handleToggleEnabled = (isEnabled: boolean) => {
    startTransition(async () => {
      try {
        const result = await toggleDiscountSettings(isEnabled);
        
        if (result.success) {
          setDiscountSetting(prev => prev ? {
            ...prev,
            isEnabled,
            updatedAt: new Date().toISOString()
          } : null);
          toast.success(`Discount settings ${isEnabled ? 'enabled' : 'disabled'}`);
        } else {
          toast.error(result.message || 'Failed to update settings');
        }
      } catch (error) {
        toast.error('Failed to update settings');
      }
    });
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!hasWarehouseSelected) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a warehouse from the dashboard to configure discount settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Discount Limits</h3>
          <p className="text-sm text-muted-foreground">
            Set maximum discount percentages that call center agents can apply for <strong>{warehouse?.name}</strong>
          </p>
        </div>
        
        {discountSetting ? (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Discount Settings</DialogTitle>
                <DialogDescription>
                  Update discount limits for {warehouse?.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxPercentage">Maximum Discount Percentage</Label>
                  <div className="relative">
                    <Input
                      id="maxPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.maxDiscountPercentage}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxDiscountPercentage: parseFloat(e.target.value) || 0 
                      }))}
                      className="pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum percentage discount agents can apply (0-100%)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Maximum Discount Amount (Optional)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxDiscountAmount: parseFloat(e.target.value) || undefined 
                    }))}
                    placeholder="No limit"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional maximum discount amount in {warehouse?.currency}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.isEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
                  />
                  <Label htmlFor="enabled">Enable discount limits</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending ? 'Saving...' : 'Update Settings'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => {
                resetForm();
                setIsEditing(true);
              }}>
                <Settings className="h-4 w-4 mr-2" />
                Configure Limits
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Discount Settings</DialogTitle>
                <DialogDescription>
                  Set maximum discount limits for {warehouse?.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxPercentage">Maximum Discount Percentage</Label>
                  <div className="relative">
                    <Input
                      id="maxPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.maxDiscountPercentage}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxDiscountPercentage: parseFloat(e.target.value) || 0 
                      }))}
                      className="pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum percentage discount agents can apply (0-100%)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Maximum Discount Amount (Optional)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxDiscountAmount: parseFloat(e.target.value) || undefined 
                    }))}
                    placeholder="No limit"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional maximum discount amount in {warehouse?.currency}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.isEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
                  />
                  <Label htmlFor="enabled">Enable discount limits</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Settings Display */}
      {discountSetting ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h4 className="font-medium">{warehouse?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {warehouse?.currency} • {warehouse?.country}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Max %:</span>
                    <Badge variant="outline" className="ml-1">
                      {discountSetting.maxDiscountPercentage}%
                    </Badge>
                  </div>
                  
                  {discountSetting.maxDiscountAmount && (
                    <div>
                      <span className="text-muted-foreground">Max Amount:</span>
                      <Badge variant="outline" className="ml-1">
                        {discountSetting.maxDiscountAmount} {warehouse?.currency}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={discountSetting.isEnabled}
                  onCheckedChange={handleToggleEnabled}
                />
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Percent className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Discount Settings</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't configured discount limits for {warehouse?.name} yet.
            </p>
            <Button onClick={() => {
              resetForm();
              setIsEditing(true);
            }}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Limits
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Call center agents will not be able to apply discounts exceeding these limits when confirming orders for {warehouse?.name}. 
          You can enable/disable these limits at any time.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Settings Card Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Skeleton */}
      <div className="border rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
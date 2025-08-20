"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Eye, EyeOff } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTokenPackage, updateTokenPackage, deleteTokenPackage } from '@/app/actions/tokens';

interface TokenPackage {
  _id: string;
  name: string;
  description?: string;
  tokenCount: number;
  priceUsd: number;
  status: 'active' | 'inactive' | 'archived';
  sortOrder: number;
  createdAt: string;
}

interface TokenSystemSettings {
  enabled: boolean;
  packages: TokenPackage[];
}

interface TokenSystemFormProps {
  settings: TokenSystemSettings;
  onSettingsChange: (settings: TokenSystemSettings) => void;
  onPackagesUpdate?: () => void;
}

export function TokenSystemForm({ settings, onSettingsChange, onPackagesUpdate }: TokenSystemFormProps) {
  const [isPending, startTransition] = useTransition();
  const [editingPackage, setEditingPackage] = useState<TokenPackage | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    tokenCount: 10,
    priceUsd: 1.0,
    status: 'active' as 'active' | 'inactive' | 'archived',
    sortOrder: 0,
  });

  const resetForm = () => {
    setPackageForm({
      name: '',
      description: '',
      tokenCount: 10,
      priceUsd: 1.0,
      status: 'active',
      sortOrder: 0,
    });
    setEditingPackage(null);
  };

  const handleCreatePackage = async () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('name', packageForm.name);
        formData.append('description', packageForm.description);
        formData.append('tokenCount', packageForm.tokenCount.toString());
        formData.append('priceUsd', packageForm.priceUsd.toString());
        formData.append('status', packageForm.status);
        formData.append('sortOrder', packageForm.sortOrder.toString());

        const result = await createTokenPackage(formData);
        
        if (result.success) {
          toast.success('Token package created successfully');
          setShowCreateDialog(false);
          resetForm();
          // Refresh the packages list
          onPackagesUpdate?.();
        }
      } catch (error) {
        toast.error('Failed to create token package');
        console.error(error);
      }
    });
  };

  const handleUpdatePackage = async () => {
    if (!editingPackage) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('name', packageForm.name);
        formData.append('description', packageForm.description);
        formData.append('tokenCount', packageForm.tokenCount.toString());
        formData.append('priceUsd', packageForm.priceUsd.toString());
        formData.append('status', packageForm.status);
        formData.append('sortOrder', packageForm.sortOrder.toString());

        const result = await updateTokenPackage(editingPackage._id, formData);
        
        if (result.success) {
          toast.success('Token package updated successfully');
          resetForm();
          // Refresh the packages list
          onPackagesUpdate?.();
        }
      } catch (error) {
        toast.error('Failed to update token package');
        console.error(error);
      }
    });
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to archive this token package?')) return;

    startTransition(async () => {
      try {
        const result = await deleteTokenPackage(packageId);
        
        if (result.success) {
          toast.success('Token package archived successfully');
          // Refresh the packages list
          onPackagesUpdate?.();
        }
      } catch (error) {
        toast.error('Failed to archive token package');
        console.error(error);
      }
    });
  };

  const startEdit = (pkg: TokenPackage) => {
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      tokenCount: pkg.tokenCount,
      priceUsd: pkg.priceUsd,
      status: pkg.status,
      sortOrder: pkg.sortOrder,
    });
    setEditingPackage(pkg);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      archived: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* System Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="token-system">Enable Token Boost System</Label>
          <p className="text-sm text-muted-foreground">
            Enable the token-based profile boosting system for providers
          </p>
        </div>
        <Switch
          id="token-system"
          checked={settings.enabled}
          onCheckedChange={(checked) => 
            onSettingsChange({ ...settings, enabled: checked })
          }
        />
      </div>

      <Separator />

      {/* Token Packages Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Token Packages</h3>
            <p className="text-sm text-muted-foreground">
              Manage available token packages for providers
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPackage ? 'Edit Token Package' : 'Create Token Package'}
                </DialogTitle>
                <DialogDescription>
                  {editingPackage 
                    ? 'Update the token package details' 
                    : 'Create a new token package for providers to purchase'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="package-name">Package Name</Label>
                  <Input
                    id="package-name"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Starter Pack"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="package-description">Description</Label>
                  <Textarea
                    id="package-description"
                    value={packageForm.description}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the package"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-count">Token Count</Label>
                    <Input
                      id="token-count"
                      type="number"
                      min="1"
                      value={packageForm.tokenCount}
                      onChange={(e) => setPackageForm(prev => ({ 
                        ...prev, 
                        tokenCount: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={packageForm.priceUsd}
                      onChange={(e) => setPackageForm(prev => ({ 
                        ...prev, 
                        priceUsd: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={packageForm.status} 
                      onValueChange={(value) => setPackageForm(prev => ({ 
                        ...prev, 
                        status: value as 'active' | 'inactive' | 'archived' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sort-order">Sort Order</Label>
                    <Input
                      id="sort-order"
                      type="number"
                      min="0"
                      value={packageForm.sortOrder}
                      onChange={(e) => setPackageForm(prev => ({ 
                        ...prev, 
                        sortOrder: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingPackage ? handleUpdatePackage : handleCreatePackage}
                  disabled={isPending || !packageForm.name}
                >
                  {isPending ? 'Saving...' : editingPackage ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Token Packages Table */}
        {settings.packages && settings.packages.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.packages
                    .filter(pkg => pkg.status !== 'archived')
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((pkg) => (
                    <TableRow key={pkg._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pkg.name}</div>
                          {pkg.description && (
                            <div className="text-sm text-muted-foreground">
                              {pkg.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pkg.tokenCount} tokens</Badge>
                      </TableCell>
                      <TableCell>${pkg.priceUsd.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                      <TableCell>{pkg.sortOrder}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              startEdit(pkg);
                              setShowCreateDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePackage(pkg._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No token packages configured yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first token package to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
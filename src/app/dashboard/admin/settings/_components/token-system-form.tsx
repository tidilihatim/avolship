"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('settings.tokens');
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
          toast.success(t('messages.packageCreated'));
          setShowCreateDialog(false);
          resetForm();
          // Refresh the packages list
          onPackagesUpdate?.();
        }
      } catch (error) {
        toast.error(t('messages.createFailed'));
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
          toast.success(t('messages.packageUpdated'));
          resetForm();
          // Refresh the packages list
          onPackagesUpdate?.();
        }
      } catch (error) {
        toast.error(t('messages.updateFailed'));
        console.error(error);
      }
    });
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm(t('messages.confirmArchive'))) return;

    startTransition(async () => {
      try {
        const result = await deleteTokenPackage(packageId);
        
        if (result.success) {
          toast.success(t('messages.packageArchived'));
          // Refresh the packages list
          onPackagesUpdate?.();
        }
      } catch (error) {
        toast.error(t('messages.archiveFailed'));
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
          <Label htmlFor="token-system">{t('enableSystem.label')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('enableSystem.description')}
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
            <h3 className="text-lg font-medium">{t('packages.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('packages.description')}
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('packages.addPackage')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPackage ? t('dialog.editTitle') : t('dialog.createTitle')}
                </DialogTitle>
                <DialogDescription>
                  {editingPackage 
                    ? t('dialog.editDescription') 
                    : t('dialog.createDescription')
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="package-name">{t('form.name.label')}</Label>
                  <Input
                    id="package-name"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('form.name.placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="package-description">{t('form.description.label')}</Label>
                  <Textarea
                    id="package-description"
                    value={packageForm.description}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('form.description.placeholder')}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-count">{t('form.tokenCount.label')}</Label>
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
                    <Label htmlFor="price">{t('form.price.label')}</Label>
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
                    <Label htmlFor="status">{t('form.status.label')}</Label>
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
                        <SelectItem value="active">{t('status.active')}</SelectItem>
                        <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sort-order">{t('form.sortOrder.label')}</Label>
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
                  {t('dialog.cancel')}
                </Button>
                <Button
                  onClick={editingPackage ? handleUpdatePackage : handleCreatePackage}
                  disabled={isPending || !packageForm.name}
                >
                  {isPending ? t('dialog.saving') : editingPackage ? t('dialog.update') : t('dialog.create')}
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
                    <TableHead>{t('table.package')}</TableHead>
                    <TableHead>{t('table.tokens')}</TableHead>
                    <TableHead>{t('table.price')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.order')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
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
                        <Badge variant="outline">{t('table.tokenCount', { count: pkg.tokenCount })}</Badge>
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
              <p className="text-muted-foreground">{t('packages.noPackages')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('packages.createFirst')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
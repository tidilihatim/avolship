'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateApiKey } from '../_actions/api-keys';
import { toast } from 'sonner';

interface ApiKey {
  _id: string;
  keyId: string;
  name: string;
  status: 'active' | 'inactive' | 'revoked';
  lastUsed?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface EditApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ApiKey | null;
  onSuccess: () => void;
}

export function EditApiKeyDialog({ open, onOpenChange, apiKey, onSuccess }: EditApiKeyDialogProps) {
  const t = useTranslations('apiManagement');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (apiKey) {
      setName(apiKey.name);
    } else {
      setName('');
    }
  }, [apiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !name.trim()) {
      toast.error(t('editDialog.nameRequired'));
      return;
    }

    if (name.trim() === apiKey.name) {
      toast.error(t('editDialog.noChanges'));
      return;
    }

    setLoading(true);
    try {
      const result = await updateApiKey({
        keyId: apiKey.keyId,
        name: name.trim()
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        onSuccess();
      }
    } catch (error) {
      toast.error(t('errors.failedToRevoke'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (apiKey) {
      setName(apiKey.name); // Reset to original name
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('editDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('editDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t('editDialog.nameLabel')}</Label>
            <Input
              id="edit-name"
              placeholder={t('editDialog.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              {t('editDialog.nameDescription')}
            </p>
          </div>

          {apiKey && (
            <div className="space-y-2">
              <Label>{t('editDialog.keyIdLabel')}</Label>
              <Input
                value={apiKey.keyId}
                disabled
                className="font-mono text-sm"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {t('editDialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || name.trim() === apiKey?.name}
            >
              {loading ? t('editDialog.updating') : t('editDialog.update')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Copy, Eye, EyeOff, AlertCircle, Download } from 'lucide-react';
import { createApiKey } from '../_actions/api-keys';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CreateApiKeyDialog() {
  const router = useRouter();
  const t = useTranslations('apiManagement');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState<{
    keyId: string;
    apiKey: string;
    apiSecret: string;
  } | null>(null);
  const [showCredentials, setShowCredentials] = useState<{
    key: boolean;
    secret: boolean;
  }>({ key: false, secret: false });

  // Debug function
  const handleButtonClick = () => {
    console.log('Button clicked, current open state:', open);
    setOpen(true);
    console.log('Set open to true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('createDialog.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const result = await createApiKey({ name: name.trim() });
      if (result.error) {
        toast.error(result.error);
      } else {
        setCredentials(result.data!.credentials);
        toast.success(t('success.created'));
        // Don't close dialog immediately - show credentials first
      }
    } catch (error) {
      toast.error(t('errors.failedToCreate'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} ${t('createDialog.copySuccess')}`);
    } catch {
      toast.error(t('createDialog.copyFailed'));
    }
  };

  const downloadCredentials = () => {
    if (!credentials) return;

    const credentialsData = {
      name: name,
      keyId: credentials.keyId,
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      createdAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(credentialsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `avolship-api-credentials-${credentials.keyId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(t('createDialog.downloadSuccess'));
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setName('');
      setCredentials(null);
      setShowCredentials({ key: false, secret: false });
      if (credentials) {
        // Refresh the page to show the new key
        router.refresh();
      }
    }
    setOpen(openState);
  };

  const maskValue = (value: string, show: boolean) => {
    if (show) return value;
    return '••••••••••••••••••••••••••••••••';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button onClick={handleButtonClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t('apiKeys.createNew')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createDialog.title')}</DialogTitle>
          <DialogDescription>
            {!credentials
              ? t('createDialog.description')
              : t('createDialog.successDescription')}
          </DialogDescription>
        </DialogHeader>

        {!credentials ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('createDialog.nameLabel')}</Label>
              <Input
                id="name"
                placeholder={t('createDialog.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                {t('createDialog.nameDescription')}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                {t('createDialog.cancel')}
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? t('createDialog.creating') : t('createDialog.create')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('createDialog.important')}</strong> {t('createDialog.credentialsWarning')}
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={downloadCredentials}
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                {t('createDialog.downloadCredentials')}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('createDialog.keyId')}</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.keyId, t('createDialog.keyId'))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="block p-2 bg-muted rounded font-mono text-sm break-all">
                  {credentials.keyId}
                </code>
                <p className="text-xs text-muted-foreground">{t('createDialog.keyIdDescription')}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('createDialog.apiKey')}</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCredentials(prev => ({ ...prev, key: !prev.key }))}
                    >
                      {showCredentials.key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials.apiKey, t('createDialog.apiKey'))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <code className="block p-2 bg-muted rounded font-mono text-sm break-all">
                  {maskValue(credentials.apiKey, showCredentials.key)}
                </code>
                <p className="text-xs text-muted-foreground">{t('createDialog.apiKeyDescription')}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('createDialog.apiSecret')}</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCredentials(prev => ({ ...prev, secret: !prev.secret }))}
                    >
                      {showCredentials.secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials.apiSecret, t('createDialog.apiSecret'))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <code className="block p-2 bg-muted rounded font-mono text-sm break-all">
                  {maskValue(credentials.apiSecret, showCredentials.secret)}
                </code>
                <p className="text-xs text-muted-foreground">{t('createDialog.apiSecretDescription')}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleClose(false)}>
                {t('createDialog.done')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
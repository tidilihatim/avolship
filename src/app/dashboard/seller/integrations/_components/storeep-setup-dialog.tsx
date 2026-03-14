'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, ExternalLink, Loader2, Store } from 'lucide-react';
import { createStoreepIntegration, confirmStoreepIntegration } from '@/app/actions/integrations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface StoreepSetupDialogProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  onIntegrationUpdate: () => void;
}

export function StoreepSetupDialog({ open, onClose, warehouseId, onIntegrationUpdate }: StoreepSetupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const t = useTranslations('storeepSetup');
  const tMessages = useTranslations('integrations.messages');

  useEffect(() => {
    if (open) {
      setIntegrationId(null);
      setWebhookUrl(null);
      setCopied(false);
      initIntegration();
    }
  }, [open]);

  async function initIntegration() {
    setLoading(true);
    try {
      const result = await createStoreepIntegration(warehouseId);
      if (result.success && result.data) {
        setIntegrationId(result.data.integrationId);
        setWebhookUrl(result.data.webhookUrl);
      } else {
        toast.error(result.error || tMessages('errors.internalError'));
        onClose();
      }
    } catch {
      toast.error(tMessages('errors.internalError'));
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!integrationId) return;
    setConfirming(true);
    try {
      const result = await confirmStoreepIntegration(integrationId);
      if (result.success) {
        toast.success(tMessages('success.storeepConnected'));
        onIntegrationUpdate();
        onClose();
      } else {
        toast.error(result.error || tMessages('errors.internalError'));
      }
    } catch {
      toast.error(tMessages('errors.internalError'));
    } finally {
      setConfirming(false);
    }
  }

  function handleCopy() {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps = [
    {
      number: 1,
      label: t('steps.step1.label'),
      description: t('steps.step1.description'),
      extra: (
        <a
          href="https://app.storeep.com/settings/webhooks/add"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="mt-2">
            {t('steps.step1.openButton')}
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </a>
      )
    },
    {
      number: 2,
      label: t('steps.step2.label'),
      description: t('steps.step2.description'),
      extra: (
        <div className="mt-2 rounded-lg border divide-y text-sm">
          {[
            { field: t('steps.step2.fields.name'), value: t('steps.step2.fields.nameValue') },
            { field: t('steps.step2.fields.type'), value: t('steps.step2.fields.typeValue') },
            { field: t('steps.step2.fields.event'), value: t('steps.step2.fields.eventValue') },
            { field: t('steps.step2.fields.format'), value: t('steps.step2.fields.formatValue') },
          ].map(({ field, value }) => (
            <div key={field} className="flex items-center gap-2 px-3 py-2">
              <span className="w-24 text-xs text-muted-foreground shrink-0">{field}</span>
              <Badge variant="secondary" className="font-mono text-xs">{value}</Badge>
            </div>
          ))}
        </div>
      )
    },
    {
      number: 3,
      label: t('steps.step3.label'),
      description: t('steps.step3.description'),
      extra: webhookUrl ? (
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all">
            {webhookUrl}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
            {copied
              ? <CheckCircle className="h-3 w-3 text-green-600" />
              : <Copy className="h-3 w-3" />
            }
          </Button>
        </div>
      ) : null
    },
    {
      number: 4,
      label: t('steps.step4.label'),
      description: t('steps.step4.description'),
      extra: null
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">{t('preparing')}</span>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>

            <div className="space-y-5">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{step.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                    {step.extra}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={onClose} disabled={confirming}>
                {t('cancel')}
              </Button>
              <Button onClick={handleConfirm} disabled={confirming}>
                {confirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('confirming')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('confirm')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

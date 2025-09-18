"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface SellerSettings {
  showDeliveryProofToSeller: boolean;
  canSellerRequestPayments: boolean;
}

interface SellerSettingsFormProps {
  settings: SellerSettings;
  onSettingsChange: (settings: SellerSettings) => void;
}

export const SellerSettingsForm: React.FC<SellerSettingsFormProps> = ({
  settings,
  onSettingsChange,
}) => {
  const t = useTranslations('settings');

  const updateSetting = (key: keyof SellerSettings, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="show-delivery-proof">{t('seller.showDeliveryProof.label')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('seller.showDeliveryProof.description')}
          </p>
        </div>
        <Switch
          id="show-delivery-proof"
          checked={settings.showDeliveryProofToSeller}
          onCheckedChange={(checked) =>
            updateSetting('showDeliveryProofToSeller', checked)
          }
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="can-request-payments">{t('seller.canRequestPayments.label')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('seller.canRequestPayments.description')}
          </p>
        </div>
        <Switch
          id="can-request-payments"
          checked={settings.canSellerRequestPayments}
          onCheckedChange={(checked) =>
            updateSetting('canSellerRequestPayments', checked)
          }
        />
      </div>
    </div>
  );
};
'use client';

import { useTranslations } from 'next-intl';

interface InvoiceErrorMessageProps {
  message?: string;
  isUnexpected?: boolean;
}

export default function InvoiceErrorMessage({ message, isUnexpected = false }: InvoiceErrorMessageProps) {
  const t = useTranslations('invoices.detail');

  return (
    <div className="container mx-auto p-6">
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          {t('errorLoadingInvoice')}
        </h2>
        <p className="text-muted-foreground">
          {isUnexpected ? t('unexpectedErrorInvoice') : message}
        </p>
      </div>
    </div>
  );
}
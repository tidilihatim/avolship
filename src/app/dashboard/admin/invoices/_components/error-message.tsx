'use client';

import { useTranslations } from 'next-intl';

interface ErrorMessageProps {
  message?: string;
  isUnexpected?: boolean;
}

export default function ErrorMessage({ message, isUnexpected = false }: ErrorMessageProps) {
  const t = useTranslations('invoices');

  return (
    <div className="container mx-auto p-6">
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          {t('errorLoading')}
        </h2>
        <p className="text-muted-foreground">
          {isUnexpected ? t('unexpectedError') : message}
        </p>
      </div>
    </div>
  );
}
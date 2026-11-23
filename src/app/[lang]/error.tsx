'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { Button } from '@/components/ui';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useApp();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <AlertTriangle className="h-14 w-14 text-amber-500" />
      <h1 className="mt-4 text-xl font-semibold">{t('error.title')}</h1>
      <p className="mt-1 text-gray-600">{t('error.text')}</p>
      <Button className="mt-6" onClick={reset}>{t('error.retry')}</Button>
    </div>
  );
}

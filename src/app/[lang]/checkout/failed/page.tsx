'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { XCircle } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { api, ApiError } from '@/lib/api-client';
import { Button, Field, Input, PageSpinner } from '@/components/ui';

function Failed() {
  const { t, href, settings } = useApp();
  const orderNumber = useSearchParams()?.get('order') || '';
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  // Read after mount so server and client render the same initial HTML.
  useEffect(() => {
    setPhone(sessionStorage.getItem(`order:${orderNumber}`) || '');
  }, [orderNumber]);

  const retry = async (method: 'bkash' | 'sslcommerz') => {
    setBusy(method);
    try {
      const { data } = await api<{ payment: { redirectUrl: string } }>('/payments/retry', { method: 'POST', body: { orderNumber, phone, method } });
      window.location.href = data.payment.redirectUrl;
    } catch (err) {
      toast.error((err as ApiError).message);
      setBusy(null);
    }
  };

  return (
    <div className="container max-w-lg py-16 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100"><XCircle className="h-9 w-9 text-red-600" /></span>
      <h1 className="mt-4 text-2xl font-bold">{t('failed.title')}</h1>
      <p className="mt-2 text-gray-600">{t('failed.text')}</p>
      {orderNumber && <p className="mt-3 font-mono font-semibold">{orderNumber}</p>}
      <div className="mt-8 space-y-3 rounded-xl bg-white p-5 text-left shadow-card">
        <Field label={t('checkout.phone')}><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" /></Field>
        <div className="grid gap-2 sm:grid-cols-2">
          {settings.bkash_enabled !== false && <Button variant="primary" block loading={busy === 'bkash'} disabled={!phone} onClick={() => retry('bkash')}>{t('failed.retryBkash')}</Button>}
          {settings.sslcommerz_enabled !== false && <Button variant="outline" block loading={busy === 'sslcommerz'} disabled={!phone} onClick={() => retry('sslcommerz')}>{t('failed.retryCard')}</Button>}
        </div>
        <p className="text-xs text-gray-500">{t('failed.codNote')}</p>
      </div>
      <Link href={href('/')} className="mt-6 inline-block text-sm text-brand-700 hover:underline">{t('nav.home')}</Link>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Failed />
    </Suspense>
  );
}

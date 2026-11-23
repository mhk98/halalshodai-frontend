'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, CheckCircle2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '@/components/providers/Providers';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api-client';
import { track } from '@/lib/analytics';
import OrderDetails from '@/components/account/OrderDetails';
import { PageSpinner } from '@/components/ui';
import type { Order } from '@/types';

function Success() {
  const { t, href } = useApp();
  const orderNumber = useSearchParams()?.get('order') || '';
  const authed = useAuthStore((s) => s.status === 'authenticated');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const phone = sessionStorage.getItem(`order:${orderNumber}`);
    if (!orderNumber || !phone) return;
    api<{ order: Order }>(`/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`)
      .then((r) => {
        const o = r.data.order;
        setOrder(o);
        // Online payment confirmed: browser half of Purchase (COD was tracked at checkout). Same event ID as
        // the server's, so Meta counts it once; the flag stops a reload from sending it again.
        const key = `purchase-tracked:${o.orderNumber}`;
        if (o.paymentMethod !== 'cod' && o.paymentStatus === 'paid' && !sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          track.purchase(o.orderNumber, o.items.map((i) => ({ id: i.productId ?? 0, name: i.productName, price: i.unitPrice, quantity: i.quantity })), o.total);
        }
      })
      .catch(() => {});
  }, [orderNumber]);

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100"><CheckCircle2 className="h-9 w-9 text-brand-600" /></span>
        <h1 className="mt-4 text-2xl font-bold">{t('success.title')}</h1>
        <p className="mt-2 max-w-md text-gray-600">{t('success.text')}</p>
        {orderNumber && <CopyOrderNumber value={orderNumber} />}
      </div>
      {order && <OrderDetails order={order} />}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={href('/products')} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">{t('cart.continue')}</Link>
        <Link href={href(authed ? '/account/orders' : `/track-order?order=${encodeURIComponent(orderNumber)}`)} className="rounded-lg border border-brand-600 px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
          {authed ? t('account.orders') : t('nav.trackOrder')}
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Success />
    </Suspense>
  );
}

/** The order number with a copy button (falls back to a hidden textarea where the Clipboard API is unavailable). */
function CopyOrderNumber({ value }: { value: string }) {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const el = document.createElement('textarea');
        el.value = value;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand('copy');
        el.remove();
        if (!ok) throw new Error('copy failed');
      }
      setCopied(true);
      toast.success(t('success.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('success.copyFailed'));
    }
  };

  return (
    <div className="mt-3 flex items-center gap-1 rounded-lg bg-white py-1.5 pl-4 pr-1.5 shadow-card">
      <span className="select-all font-mono text-lg font-semibold" data-testid="order-number">{value}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={t('success.copy')}
        title={t('success.copy')}
        className="ml-1 inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? t('success.copiedShort') : t('success.copy')}
      </button>
    </div>
  );
}

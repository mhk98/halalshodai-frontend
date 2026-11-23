'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, PackageSearch, Phone, Hash, Info } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { api, ApiError } from '@/lib/api-client';
import { BD_PHONE, date, money } from '@/lib/format';
import { Button, Field, Input } from '@/components/ui';
import OrderDetails, { StatusBadge } from '@/components/account/OrderDetails';
import type { Order } from '@/types';

type Brief = { orderNumber: string; status: Order['status']; total: number; customerName: string; createdAt: string };

export default function TrackOrder() {
  const { t, lang } = useApp();
  const initial = useSearchParams()?.get('order') || '';
  const [orderNumber, setOrderNumber] = useState(initial);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [list, setList] = useState<Brief[] | null>(null);

  const lookup = async (num?: string) => {
    const p = phone.replace(/[\s-]/g, '');
    if (!BD_PHONE.test(p)) return setError(t('validation.phone'));
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ phone: p, ...((num ?? orderNumber.trim()) ? { orderNumber: (num ?? orderNumber).trim() } : {}) });
      const { data } = await api<{ order?: Order; orders?: Brief[] }>(`/orders/track?${q}`);
      setOrder(data.order ?? null);
      setList(data.orders ?? null);
      if (data.orders && !data.orders.length) setError(t('track.none'));
    } catch (err) {
      setError((err as ApiError).message);
      setOrder(null);
      setList(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 text-center">
        <PackageSearch className="mx-auto h-12 w-12 text-brand-600" />
        <h1 className="mt-3 text-2xl font-bold">{t('nav.trackOrder')}</h1>
        <p className="mt-1 text-gray-600">{t('track.subtitle')}</p>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); lookup(); }}
        className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-5 shadow-card sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label={t('checkout.phone')} required>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="h-11 pl-9" />
            </div>
          </Field>
          <Field label={<>{t('track.orderNumber')} <span className="font-normal text-gray-400">({t('track.optional')})</span></>}>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ORD-…" className="h-11 pl-9" />
            </div>
          </Field>
          <Button type="submit" loading={loading} icon={<Search className="h-4 w-4" />} className="h-11 w-full whitespace-nowrap px-6 sm:w-auto">{t('track.button')}</Button>
        </div>
        <p className="mt-4 flex items-start gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{t('track.help')}
        </p>
      </form>
      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {list && list.length > 0 && (
        <ul className="mx-auto mt-6 max-w-2xl divide-y rounded-xl bg-white shadow-card">
          {list.map((o) => (
            <li key={o.orderNumber}>
              <button type="button" onClick={() => { setOrderNumber(o.orderNumber); lookup(o.orderNumber); }} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-gray-50">
                <span>
                  <span className="block font-medium">{o.orderNumber}</span>
                  <span className="text-xs text-gray-500">{date(o.createdAt, lang)} · {o.customerName}</span>
                </span>
                <span className="flex items-center gap-3"><span className="text-sm font-semibold">{money(o.total, lang)}</span><StatusBadge status={o.status} /></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {order && <div className="mt-8"><OrderDetails order={order} /></div>}
    </div>
  );
}

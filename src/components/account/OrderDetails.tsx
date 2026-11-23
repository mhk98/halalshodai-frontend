'use client';

import Image from 'next/image';
import clsx from 'clsx';
import { Check, Package, Truck, Home, ClipboardCheck, XCircle, RotateCcw } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { date, money } from '@/lib/format';
import type { Order, OrderStatus } from '@/types';

const FLOW: { status: OrderStatus; icon: typeof Check }[] = [
  { status: 'pending', icon: ClipboardCheck },
  { status: 'confirmed', icon: Check },
  { status: 'processing', icon: Package },
  { status: 'shipped', icon: Truck },
  { status: 'delivered', icon: Home },
];

const statusColor: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  processing: 'bg-violet-100 text-violet-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-brand-100 text-brand-800',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useApp();
  return <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusColor[status])}>{t(`status.${status}`)}</span>;
}

/** Progress tracker + items + totals for a customer-facing order. */
export default function OrderDetails({ order }: { order: Order }) {
  const { t, lang } = useApp();
  const closed = order.status === 'cancelled' || order.status === 'returned';
  const reached = FLOW.findIndex((f) => f.status === order.status);
  const whenFor = (s: OrderStatus) => order.statusHistory.find((h) => h.status === s)?.at;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-gray-500">{t('order.number')}</p>
            <p className="text-lg font-bold">{order.orderNumber}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-gray-500">{date(order.createdAt, lang, true)}</p>

        {closed ? (
          <p className="mt-5 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {order.status === 'cancelled' ? <XCircle className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />} {order.status === 'cancelled' ? t('order.cancelledNote') : t('order.returnedNote')}
          </p>
        ) : (
          <ol className="mt-6 grid grid-cols-5 gap-1">
            {FLOW.map((f, i) => {
              const done = i <= reached;
              const at = whenFor(f.status);
              return (
                <li key={f.status} className="relative flex flex-col items-center text-center">
                  {i > 0 && <span className={clsx('absolute right-1/2 top-4 h-0.5 w-full', i <= reached ? 'bg-brand-500' : 'bg-gray-200')} />}
                  <span className={clsx('relative z-10 flex h-8 w-8 items-center justify-center rounded-full', done ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400')}>
                    <f.icon className="h-4 w-4" />
                  </span>
                  <span className={clsx('mt-2 text-[11px] sm:text-xs', done ? 'font-medium text-gray-800' : 'text-gray-400')}>{t(`status.${f.status}`)}</span>
                  {at && <span className="hidden text-[10px] text-gray-400 sm:block">{date(at, lang)}</span>}
                </li>
              );
            })}
          </ol>
        )}
        {order.trackingCode && (
          <p className="mt-5 rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
            {t('order.courier')}: <strong>{order.courierName}</strong> · {t('order.trackingCode')}: <strong>{order.trackingCode}</strong>
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-card">
          <h3 className="mb-3 font-semibold">{t('order.items')}</h3>
          <ul className="divide-y">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center gap-3 py-3 text-sm">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-gray-50">
                  {it.image && <Image src={it.image} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1">{it.productName}</span>
                  <span className="text-xs text-gray-500">{[it.variantName, `× ${it.quantity}`].filter(Boolean).join(' ')}</span>
                </span>
                <span className="font-medium">{money(it.total, lang)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">{t('cart.subtotal')}</dt><dd>{money(order.subtotal, lang)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-brand-700"><dt>{t('checkout.discount')}</dt><dd>−{money(order.discount, lang)}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-600">{t('checkout.delivery')}</dt><dd>{money(order.deliveryCharge, lang)}</dd></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>{t('checkout.total')}</dt><dd>{money(order.total, lang)}</dd></div>
          </dl>
        </div>
        <div className="space-y-4 rounded-xl bg-white p-5 text-sm shadow-card">
          <div>
            <h3 className="mb-1 font-semibold">{t('order.shippingTo')}</h3>
            <p>{order.customerName} · {order.customerPhone}</p>
            <p className="text-gray-600">{[order.shippingAddress, order.shippingArea, order.shippingCity, order.shippingDistrict].filter(Boolean).join(', ')}</p>
            {order.deliveryZoneName && <p className="text-gray-500">{order.deliveryZoneName}</p>}
          </div>
          <div>
            <h3 className="mb-1 font-semibold">{t('checkout.payment')}</h3>
            <p>{t(`payment.${order.paymentMethod}`)} · <span className={order.paymentStatus === 'paid' ? 'text-brand-700' : 'text-gray-600'}>{t(`paymentStatus.${order.paymentStatus}`)}</span></p>
          </div>
          {order.customerNote && (
            <div>
              <h3 className="mb-1 font-semibold">{t('checkout.note')}</h3>
              <p className="text-gray-600">{order.customerNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

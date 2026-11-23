'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { api } from '@/lib/api-client';
import { date, money } from '@/lib/format';
import { Button, PageSpinner } from '@/components/ui';
import { StatusBadge } from '@/components/account/OrderDetails';
import type { Order, PaginationMeta } from '@/types';

export default function OrdersPage() {
  const { t, lang, href } = useApp();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['my-orders', page], queryFn: () => api<Order[]>(`/account/orders?page=${page}`) });
  const meta = data?.meta as PaginationMeta | undefined;

  if (isLoading) return <PageSpinner />;

  return (
    <section className="rounded-xl bg-white p-5 shadow-card">
      <h1 className="mb-4 text-lg font-semibold">{t('account.orders')}</h1>
      {data?.data.length ? (
        <ul className="divide-y">
          {data.data.map((o) => (
            <li key={o.orderNumber}>
              <Link href={href(`/account/orders/${o.orderNumber}`)} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-gray-50 sm:px-2">
                <div>
                  <p className="font-medium text-gray-900">{o.orderNumber}</p>
                  <p className="text-xs text-gray-500">{date(o.createdAt, lang)} · {t('account.itemsCount', { n: o.items.reduce((s, i) => s + i.quantity, 0) })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{money(o.total, lang)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center py-10 text-center">
          <Package className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-600">{t('account.noOrders')}</p>
          <Link href={href('/products')} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">{t('cart.startShopping')}</Link>
        </div>
      )}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button size="sm" variant="ghost" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>{t('common.previous')}</Button>
          <Button size="sm" variant="ghost" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
        </div>
      )}
    </section>
  );
}

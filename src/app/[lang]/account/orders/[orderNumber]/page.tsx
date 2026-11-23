'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { api, ApiError } from '@/lib/api-client';
import { Button, PageSpinner } from '@/components/ui';
import OrderDetails from '@/components/account/OrderDetails';
import type { Order } from '@/types';

export default function AccountOrderPage({ params }: { params: { orderNumber: string } }) {
  const { t, href } = useApp();
  const qc = useQueryClient();
  const key = ['my-order', params.orderNumber];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: async () => (await api<Order>(`/account/orders/${encodeURIComponent(params.orderNumber)}`)).data });

  const cancel = async () => {
    if (!window.confirm(t('account.cancelConfirm'))) return;
    try {
      const { data: o } = await api<Order>(`/account/orders/${encodeURIComponent(params.orderNumber)}/cancel`, { method: 'POST' });
      qc.setQueryData(key, o);
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success(t('account.cancelled'));
    } catch (err) {
      toast.error((err as ApiError).message);
    }
  };

  if (isLoading) return <PageSpinner />;
  if (error || !data) return <p className="rounded-xl bg-white p-6 text-center text-gray-600 shadow-card">{(error as Error)?.message}</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href={href('/account/orders')} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-700"><ArrowLeft className="h-4 w-4" />{t('account.orders')}</Link>
        {data.canCancel && <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={cancel}>{t('account.cancelOrder')}</Button>}
      </div>
      <OrderDetails order={data} />
    </div>
  );
}

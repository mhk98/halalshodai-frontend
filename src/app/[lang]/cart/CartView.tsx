'use client';

import Link from 'next/link';
import { ShoppingBag, AlertTriangle } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore } from '@/store/cart';
import { CartLineItem } from '@/components/cart/CartLines';
import { PageSpinner } from '@/components/ui';
import { money } from '@/lib/format';

export default function CartView() {
  const { t, lang, href } = useApp();
  const { cart, loaded } = useCartStore();

  if (!loaded) return <PageSpinner />;

  if (!cart.items.length) {
    return (
      <div className="container flex flex-col items-center py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-xl font-semibold">{t('cart.empty')}</h1>
        <Link href={href('/products')} className="mt-6 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700">{t('cart.startShopping')}</Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('cart.title')}</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white px-5 shadow-card lg:col-span-2">
          {cart.hasIssues && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {t('cart.issuesNote')}
            </p>
          )}
          <ul className="divide-y">{cart.items.map((l) => <CartLineItem key={l.id} line={l} />)}</ul>
        </div>
        <aside className="h-fit rounded-xl bg-white p-5 shadow-card lg:sticky lg:top-36">
          <h2 className="mb-4 font-semibold">{t('checkout.summary')}</h2>
          <div className="flex justify-between text-sm"><span className="text-gray-600">{t('cart.subtotal')} ({cart.itemCount})</span><span className="font-semibold">{money(cart.subtotal, lang)}</span></div>
          <p className="mt-2 text-xs text-gray-500">{t('cart.shippingNote')}</p>
          <Link href={href('/checkout')} className="mt-5 block rounded-lg bg-brand-600 py-3 text-center font-medium text-white hover:bg-brand-700">{t('cart.checkout')}</Link>
          <Link href={href('/products')} className="mt-3 block text-center text-sm text-brand-700 hover:underline">{t('cart.continue')}</Link>
        </aside>
      </div>
    </div>
  );
}

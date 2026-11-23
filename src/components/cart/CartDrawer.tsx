'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ShoppingBag, X } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore } from '@/store/cart';
import { money } from '@/lib/format';
import { stripLang } from '@/lib/routes';
import { CartLineItem } from './CartLines';

const DESKTOP = '(min-width: 1024px)';

/**
 * Cart.
 *  - Desktop (≥1024px): a side panel below the header, without a backdrop. The page stays usable
 *    (keep adding products while it's open) and shifts left so nothing hides behind it
 *    (`html.cart-panel-open`, see globals.css). It stays open while browsing.
 *  - Phone/tablet: a modal drawer with a backdrop that closes on navigation.
 */
export default function CartDrawer() {
  const { t, lang, href } = useApp();
  const { cart, drawerOpen, openDrawer } = useCartStore();
  const pathname = usePathname();
  const [desktop, setDesktop] = useState(false);
  const close = () => openDrawer(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Navigation: the modal drawer closes; the desktop panel stays, except on the cart / checkout pages.
  useEffect(() => {
    const page = stripLang(pathname || '/');
    if (!window.matchMedia(DESKTOP).matches || page.startsWith('/cart') || page.startsWith('/checkout')) openDrawer(false);
  }, [pathname, openDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openDrawer(false);
    document.addEventListener('keydown', onKey);
    if (desktop) document.documentElement.classList.add('cart-panel-open');
    else document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('cart-panel-open');
      document.body.style.overflow = '';
    };
  }, [drawerOpen, desktop, openDrawer]);

  if (!drawerOpen) return null;

  const panel = (
    <aside
      role="dialog"
      aria-modal={!desktop}
      aria-label={t('cart.title')}
      className={clsx(
        'flex flex-col bg-white',
        desktop
          ? 'fixed bottom-0 right-0 top-[120px] z-30 w-[380px] border-l border-gray-200 shadow-[-8px_0_24px_rgba(16,24,16,0.06)]'
          : 'absolute inset-y-0 right-0 w-full max-w-md animate-slide-in shadow-xl',
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
        <h2 className="text-lg font-semibold">{t('cart.title')} ({cart.itemCount})</h2>
        <button type="button" onClick={close} className="rounded-lg p-1.5 hover:bg-gray-100" aria-label={t('common.close')}><X className="h-5 w-5" /></button>
      </div>
      {cart.items.length ? (
        <>
          <ul className="flex-1 divide-y overflow-y-auto px-5">
            {/* On desktop the panel stays open when following a product link; on phones it closes. */}
            {cart.items.map((line) => <CartLineItem key={line.id} line={line} onNavigate={desktop ? undefined : close} />)}
          </ul>
          <div className="space-y-3 border-t p-5">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">{t('cart.subtotal')}</span>
              <span className="font-bold">{money(cart.subtotal, lang)}</span>
            </div>
            <p className="text-xs text-gray-500">{t('cart.shippingNote')}</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href={href('/cart')} onClick={close} className="rounded-lg border border-brand-600 py-3 text-center text-sm font-medium text-brand-700 hover:bg-brand-50">{t('cart.viewCart')}</Link>
              <Link href={href('/checkout')} onClick={close} className="rounded-lg bg-brand-600 py-3 text-center text-sm font-medium text-white hover:bg-brand-700">{t('cart.checkout')}</Link>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <ShoppingBag className="h-14 w-14 text-gray-300" />
          <p className="text-gray-600">{t('cart.empty')}</p>
          <Link href={href('/products')} onClick={desktop ? undefined : close} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">{t('cart.startShopping')}</Link>
        </div>
      )}
    </aside>
  );

  if (desktop) return panel;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={close} />
      {panel}
    </div>
  );
}

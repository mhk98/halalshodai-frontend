'use client';

import { ShoppingBag } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore } from '@/store/cart';
import { money, num } from '@/lib/format';

/** Cart tab fixed to the right edge (desktop): item count and total; opens the cart drawer. */
export default function FloatingCart() {
  const { t, lang } = useApp();
  const { itemCount, subtotal } = useCartStore((s) => s.cart);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const drawerOpen = useCartStore((s) => s.drawerOpen);

  if (drawerOpen) return null; // the cart panel is already showing

  return (
    <button
      type="button"
      onClick={() => openDrawer(true)}
      aria-label={t('nav.cart')}
      className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 overflow-hidden rounded-l-lg shadow-lg transition hover:-translate-x-0.5 lg:block"
    >
      <span className="flex flex-col items-center gap-1 bg-gold-500 px-2.5 py-2.5 text-gray-900">
        <ShoppingBag className="h-5 w-5" />
        <span className="text-[11px] font-semibold">{t('header.items', { n: num(itemCount, lang) })}</span>
      </span>
      <span className="block bg-white px-2 py-1.5 text-center text-xs font-bold text-forest-800">{money(subtotal, lang)}</span>
    </button>
  );
}

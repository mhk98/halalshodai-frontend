'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Home, LayoutGrid, ShoppingBag, User, Heart } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { stripLang } from '@/lib/routes';

/** App-style bottom navigation on phones. */
export default function MobileBottomNav() {
  const { t, href } = useApp();
  const path = stripLang(usePathname() || '/');
  const count = useCartStore((s) => s.cart.itemCount);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const authed = useAuthStore((s) => s.status === 'authenticated');

  const item = (active: boolean) => clsx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]', active ? 'text-brand-700' : 'text-gray-500');

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden" aria-label="Mobile">
      <Link href={href('/')} className={item(path === '/')}><Home className="h-5 w-5" />{t('nav.home')}</Link>
      <Link href={href('/products')} className={item(path.startsWith('/products') || path.startsWith('/category'))}><LayoutGrid className="h-5 w-5" />{t('nav.shop')}</Link>
      <button type="button" onClick={() => openDrawer(true)} className={item(false)}>
        <span className="relative">
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-honey-500 px-1 text-[10px] font-bold text-white">{count}</span>}
        </span>
        {t('nav.cart')}
      </button>
      <Link href={href('/wishlist')} className={item(path === '/wishlist')}><Heart className="h-5 w-5" />{t('nav.wishlist')}</Link>
      <Link href={href(authed ? '/account' : '/login')} className={item(path.startsWith('/account') || path === '/login')}><User className="h-5 w-5" />{t('header.account')}</Link>
    </nav>
  );
}

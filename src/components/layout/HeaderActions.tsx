'use client';

import Link from 'next/link';
import { PackageSearch, ShoppingCart, User } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';

function Count({ n }: { n: number }) {
  return (
    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-gray-900">
      {n > 99 ? '99+' : n}
    </span>
  );
}

const item = 'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-white hover:bg-white/10';

/** Icon + label buttons on the dark header bar: Order Track, Sign In / Account, Cart. */
export default function HeaderActions() {
  const { t, href } = useApp();
  const itemCount = useCartStore((s) => s.cart.itemCount);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { user, status } = useAuthStore();
  const signedIn = status === 'authenticated';

  return (
    <div className="ml-auto flex items-center gap-1 sm:gap-2">
      <Link href={href('/track-order')} className={`${item} hidden sm:flex`}>
        <PackageSearch className="h-6 w-6" strokeWidth={1.75} />
        <span className="text-xs">{t('header.orderTrack')}</span>
      </Link>
      <Link href={signedIn ? href('/account') : href('/login')} className={item}>
        <User className="h-6 w-6" strokeWidth={1.75} />
        <span className="hidden max-w-[80px] truncate text-xs sm:block">{signedIn ? user?.name?.split(' ')[0] : t('header.signIn')}</span>
      </Link>
      <button type="button" onClick={() => openDrawer(true)} className={item} aria-label={t('nav.cart')}>
        <span className="relative">
          <ShoppingCart className="h-6 w-6" strokeWidth={1.75} />
          <Count n={itemCount} />
        </span>
        <span className="hidden text-xs sm:block">{t('nav.cart')}</span>
      </button>
    </div>
  );
}

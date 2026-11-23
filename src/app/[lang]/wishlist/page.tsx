'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useWishlistStore } from '@/store/wishlist';
import { useAuthStore } from '@/store/auth';
import { ProductGrid } from '@/components/product/ProductCard';

export default function WishlistPage() {
  const { t, href } = useApp();
  const items = useWishlistStore((s) => s.items);
  const authed = useAuthStore((s) => s.status === 'authenticated');

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-2xl font-bold">{t('nav.wishlist')}</h1>
      {!authed && items.length > 0 && (
        <p className="mb-5 text-sm text-gray-500">
          <Link href={href('/login')} className="font-medium text-brand-700 underline">{t('auth.login')}</Link> {t('wishlist.loginToSync')}
        </p>
      )}
      {items.length ? (
        <ProductGrid products={items} />
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <Heart className="h-14 w-14 text-gray-300" />
          <p className="mt-3 text-gray-600">{t('wishlist.empty')}</p>
          <Link href={href('/products')} className="mt-5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white">{t('cart.startShopping')}</Link>
        </div>
      )}
    </div>
  );
}

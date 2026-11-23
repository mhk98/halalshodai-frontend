'use client';

import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useWishlistStore } from '@/store/wishlist';
import type { ProductCard } from '@/types';

export default function WishlistButton({ product, className, withLabel }: { product: ProductCard; className?: string; withLabel?: boolean }) {
  const { t } = useApp();
  const active = useWishlistStore((s) => s.items.some((p) => p.id === product.id));
  const toggle = useWishlistStore((s) => s.toggle);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const added = await toggle(product);
      toast.success(added ? t('wishlist.added') : t('wishlist.removed'));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? t('wishlist.remove') : t('wishlist.add')}
      className={clsx('inline-flex items-center gap-2 transition', className)}
    >
      <Heart className={clsx('h-5 w-5', active ? 'fill-red-500 text-red-500' : 'text-gray-500')} />
      {withLabel && <span className="text-sm">{active ? t('wishlist.saved') : t('wishlist.add')}</span>}
    </button>
  );
}

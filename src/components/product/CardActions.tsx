'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore, type CartPreview } from '@/store/cart';
import { track } from '@/lib/analytics';
import type { ProductCard } from '@/types';

/**
 * "Add to cart" + "Buy now" on product cards.
 *  - one size: add to cart opens the cart drawer the first time (then a short notice); buy now goes to checkout
 *  - several sizes: both open the product page to pick a size
 *  - out of stock: a single disabled button
 * `compact` is the horizontal list card (auto-width buttons); otherwise they share the card width.
 * On narrow cards (grid below md, list below lg) the cart button is icon-only so both fit on one line.
 */
export default function CardActions({ product, compact = false, className }: { product: ProductCard; compact?: boolean; className?: string }) {
  const { t, href } = useApp();
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const revealAfterAdd = useCartStore((s) => s.revealAfterAdd);
  const [busy, setBusy] = useState<'cart' | 'buy' | null>(null);
  const def = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const pickSize = product.variants.length > 1;
  const url = href(`/products/${product.slug}`);

  const base = clsx('inline-flex h-10 items-center justify-center gap-1.5 rounded-md text-[13px] font-semibold transition sm:text-sm', !compact && 'min-w-0 flex-1');
  const cartStyle = clsx(base, 'border border-gold-500 bg-white px-2.5 text-forest-800 hover:bg-gold-500/10', compact ? 'lg:px-4' : 'w-10 flex-none px-0 md:w-auto md:flex-1 md:px-2.5');
  const buyStyle = clsx(base, 'bg-gold-500 px-2 text-gray-900 sm:px-3 shadow-sm hover:bg-gold-400 active:bg-gold-600', compact && 'px-4');

  if (!product.inStock) {
    return (
      <div className={className}>
        <span className={clsx(base, 'w-full cursor-not-allowed bg-gray-200 px-4 text-gray-500', compact && 'w-auto')}>{t('product.outOfStock')}</span>
      </div>
    );
  }

  const preview: CartPreview = {
    name: product.name,
    nameBn: product.nameBn,
    slug: product.slug,
    image: product.image,
    unitPrice: def?.price ?? product.price,
    regularPrice: def?.regularPrice ?? product.regularPrice,
    stock: def?.stock ?? product.stock,
    variantName: def?.name ?? null,
    variantNameBn: def?.nameBn ?? null,
  };

  const run = async (kind: 'cart' | 'buy') => {
    const adding = add(product.id, def?.id ?? null, 1, preview);
    track.addToCart({ id: product.id, name: product.name, price: preview.unitPrice, quantity: 1, variant: def?.name });
    if (kind === 'cart') {
      // The line shows in the cart at once; the server confirms in the background.
      if (!revealAfterAdd()) toast.success(t('cart.added'));
      adding.catch((err) => toast.error((err as Error).message));
      return;
    }
    // Buy now: checkout needs the server's cart, so wait for it.
    setBusy('buy');
    try {
      await adding;
      router.push(href('/checkout'));
      return; // keep the spinner until the checkout page takes over
    } catch (err) {
      toast.error((err as Error).message);
    }
    setBusy(null);
  };

  const cartLabel = (
    <>
      {busy === 'cart' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4 shrink-0" />}
      {/* The button has an aria-label, so the visible text can simply be hidden on narrow cards. */}
      <span className={clsx('hidden whitespace-nowrap', compact ? 'lg:inline' : 'md:inline')}>{t('product.addToCartShort')}</span>
    </>
  );
  const buyLabel = (
    <>
      {busy === 'buy' && <Loader2 className="h-4 w-4 animate-spin" />}
      <span className="truncate whitespace-nowrap">{t('product.buyNow')}</span>
    </>
  );

  return (
    <div className={clsx('flex gap-2', className)}>
      {pickSize ? (
        <>
          <Link href={url} className={cartStyle} aria-label={t('product.addToCart')}>{cartLabel}</Link>
          <Link href={url} className={buyStyle}>{buyLabel}</Link>
        </>
      ) : (
        <>
          <button type="button" onClick={() => run('cart')} disabled={busy !== null} className={cartStyle} aria-label={t('product.addToCart')}>{cartLabel}</button>
          <button type="button" onClick={() => run('buy')} disabled={busy !== null} className={buyStyle}>{buyLabel}</button>
        </>
      )}
    </div>
  );
}

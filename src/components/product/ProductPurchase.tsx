'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Zap, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore } from '@/store/cart';
import { track } from '@/lib/analytics';
import { ln } from '@/lib/routes';
import { num } from '@/lib/format';
import { Button } from '@/components/ui';
import { QtyStepper } from '@/components/cart/CartLines';
import { Price } from './bits';
import AddToCartButton from './AddToCartButton';
import WishlistButton from './WishlistButton';
import type { ProductCard, ProductDetail } from '@/types';

/** Variant picker, live price/stock, quantity, Add to cart / Buy now. */
export default function ProductPurchase({ product }: { product: ProductDetail }) {
  const { lang, t, href } = useApp();
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants.find((v) => v.inStock) ?? product.variants[0];
  const [variantId, setVariantId] = useState<number | null>(defaultVariant?.id ?? null);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const price = variant ? variant.price : product.price;
  const regular = variant ? variant.regularPrice : product.regularPrice;
  const stock = variant ? variant.stock : product.stock;
  const inStock = stock > 0;
  const name = ln(lang, product.name, product.nameBn);

  useEffect(() => {
    track.viewItem({ id: product.id, name: product.name, price });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, stock || 1)));
  }, [stock]);

  // Card shape for the wishlist store.
  const card: ProductCard = useMemo(
    () => ({
      id: product.id, name: product.name, nameBn: product.nameBn, slug: product.slug, image: product.images[0]?.url ?? null, hoverImage: null,
      regularPrice: product.regularPrice, price: product.price, discountPercent: product.discountPercent, inStock: product.inStock,
      stock: product.stock, unit: product.unit, hasVariants: product.hasVariants, variants: product.variants,
      avgRating: product.avgRating, reviewCount: product.reviewCount,
      badges: { featured: false, bestSeller: false, newArrival: false, combo: product.isCombo },
    }),
    [product],
  );

  const buyNow = async () => {
    setBuying(true);
    try {
      await add(product.id, variantId, qty);
      track.addToCart({ id: product.id, name: product.name, price, quantity: qty, variant: variant?.name });
      router.push(href('/checkout'));
    } catch (err) {
      toast.error((err as Error).message);
      setBuying(false);
    }
  };

  const save = regular > price ? regular - price : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Price price={price} regular={regular} lang={lang} size="lg" />
        {save > 0 && <span className="rounded-md bg-red-50 px-2 py-1 text-sm font-semibold text-red-600">{t('product.save', { amount: `৳${num(save, lang)}` })}</span>}
      </div>

      <p className={clsx('flex items-center gap-1.5 text-sm font-medium', inStock ? 'text-brand-700' : 'text-red-600')}>
        {inStock ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {inStock ? (stock <= 5 ? t('product.onlyLeft', { n: num(stock, lang) }) : t('product.inStock')) : t('product.outOfStock')}
      </p>

      {product.variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-800">{t('product.chooseSize')}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('product.chooseSize')}>
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={v.id === variantId}
                onClick={() => setVariantId(v.id)}
                className={clsx(
                  'rounded-lg border px-4 py-2 text-sm transition',
                  v.id === variantId ? 'border-brand-600 bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-600' : 'border-gray-300 bg-white text-gray-700 hover:border-brand-400',
                  !v.inStock && 'opacity-50 line-through',
                )}
              >
                {ln(lang, v.name, v.nameBn)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} onChange={setQty} max={stock} disabled={!inStock} />
        <WishlistButton product={card} withLabel className="rounded-lg border border-gray-300 px-3 py-2.5 hover:bg-gray-50" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AddToCartButton
          productId={product.id}
          variantId={variantId}
          name={product.name}
          price={price}
          quantity={qty}
          variantName={variant?.name}
          preview={{ name: product.name, nameBn: product.nameBn, slug: product.slug, image: product.images[0]?.url ?? null, unitPrice: price, regularPrice: regular, stock, variantName: variant?.name ?? null, variantNameBn: variant?.nameBn ?? null }}
          disabled={!inStock}
          size="lg"
          variant="outline"
          block
        />
        <Button size="lg" variant="honey" block icon={<Zap className="h-4 w-4" />} loading={buying} disabled={!inStock} onClick={buyNow}>
          {t('product.buyNow')}
        </Button>
      </div>
      <p className="sr-only">{name}</p>
    </div>
  );
}

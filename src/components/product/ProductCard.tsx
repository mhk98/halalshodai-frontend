'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { ImageOff } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { money } from '@/lib/format';
import type { Lang, ProductCard as Card } from '@/types';
import CardActions from './CardActions';
import WishlistButton from './WishlistButton';

/** "বাংলা নাম | English Name": the Bangla part dark, the English part muted (as on the packaging). */
export function ProductName({ product, className }: { product: Pick<Card, 'name' | 'nameBn'>; className?: string }) {
  const bn = product.nameBn?.trim();
  return (
    <span className={className}>
      {bn && bn !== product.name ? (
        <>
          <span className="text-forest-800">{bn}</span>
          <span className="text-gray-500"> | {product.name}</span>
        </>
      ) : (
        <span className="text-forest-800">{product.name}</span>
      )}
    </span>
  );
}

export function CardPrice({ product, lang, large = false }: { product: Card; lang: Lang; large?: boolean }) {
  const onSale = product.regularPrice > product.price;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={clsx('whitespace-nowrap font-bold text-gray-900', large ? 'text-lg' : 'text-[15px] sm:text-base')}>{money(product.price, lang)}</span>
      {onSale && <span className="whitespace-nowrap text-[11px] text-gray-400 line-through sm:text-xs">{money(product.regularPrice, lang)}</span>}
    </p>
  );
}

/** Grid card: image on white, details on sand, full-width "Buy now". */
export default function ProductCard({ product, priority = false }: { product: Card; priority?: boolean }) {
  const { lang, href } = useApp();
  const url = href(`/products/${product.slug}`);
  const alt = product.nameBn || product.name;
  const [broken, setBroken] = useState(false);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200/70 bg-white transition hover:shadow-card">
      <Link href={url} className="relative block aspect-square overflow-hidden bg-white">
        {product.image && !broken ? (
          <Image
            src={product.image}
            alt={alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-2 text-[0px] transition duration-300 group-hover:scale-105 sm:p-3"
            priority={priority}
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-gray-50 text-gray-300" aria-hidden>
            <ImageOff className="h-8 w-8" />
          </span>
        )}
      </Link>
      <WishlistButton product={product} className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1.5 shadow-sm transition hover:bg-white lg:opacity-0 lg:focus:opacity-100 lg:group-hover:opacity-100 [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-5 sm:[&_svg]:w-5" />
      <div className="flex flex-1 flex-col bg-sand p-2 sm:p-3">
        <Link href={url} className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-5 sm:text-sm">
          <ProductName product={product} />
        </Link>
        <div className="mt-1.5 sm:mt-2">
          <CardPrice product={product} lang={lang} />
        </div>
        <div className="mt-auto pt-2 sm:pt-2.5">
          <CardActions product={product} />
        </div>
      </div>
    </article>
  );
}

/** Horizontal card (Honey / New Arrival sections): image left, details right. */
export function ProductListCard({ product }: { product: Card }) {
  const { lang, href } = useApp();
  const url = href(`/products/${product.slug}`);
  return (
    <article className="flex items-center gap-4 rounded-xl border border-gray-200/70 bg-white p-4 transition hover:shadow-card">
      <Link href={url} className="relative block aspect-square w-28 shrink-0 sm:w-36">
        {product.image && <Image src={product.image} alt={product.nameBn || product.name} fill sizes="144px" className="object-contain" />}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={url} className="line-clamp-2 text-[15px] font-medium leading-6">
          <ProductName product={product} />
        </Link>
        <div className="mt-1.5">
          <CardPrice product={product} lang={lang} large />
        </div>
        <CardActions product={product} compact className="mt-3" />
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Card[]; priorityCount?: number }) {
  return (
    <div className="product-grid grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < priorityCount} />)}
    </div>
  );
}

export function ProductList({ products }: { products: Card[] }) {
  return (
    <div className="product-list grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => <ProductListCard key={p.id} product={p} />)}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/components/providers/Providers';
import { api } from '@/lib/api-client';
import { ln } from '@/lib/routes';
import { ProductGrid } from '@/components/product/ProductCard';
import { PageSpinner } from '@/components/ui';
import type { Category, ProductCard } from '@/types';

const LIMIT = 20;

/**
 * "All Products" with category pills. The first tab ("All") is rendered on the server from /home;
 * the other tabs load from /products?category=… when clicked (and stay cached).
 */
export default function AllProducts({ categories, initial, total }: { categories: Category[]; initial: ProductCard[]; total: number }) {
  const { t, lang, href } = useApp();
  const [active, setActive] = useState<string>('');

  const tab = useQuery({
    queryKey: ['home-tab', active],
    queryFn: async () => {
      const res = await api<ProductCard[]>(`/products?category=${encodeURIComponent(active)}&limit=${LIMIT}`);
      return { products: res.data, total: (res.meta as { total?: number } | undefined)?.total ?? res.data.length };
    },
    enabled: active !== '',
    staleTime: 60_000,
  });

  const products = active ? tab.data?.products ?? [] : initial;
  const count = active ? tab.data?.total ?? 0 : total;
  const more = active ? href(`/category/${active}`) : href('/products');

  const pill = (slug: string, label: string) => (
    <button
      key={slug || 'all'}
      type="button"
      onClick={() => setActive(slug)}
      aria-pressed={active === slug}
      className={clsx(
        'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition',
        active === slug ? 'border-forest-800 bg-forest-800 text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-forest-800',
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="scrollbar-none -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {pill('', t('home.all'))}
        {categories.map((c) => pill(c.slug, ln(lang, c.name, c.nameBn)))}
      </div>
      {active && tab.isLoading ? (
        <PageSpinner />
      ) : products.length ? (
        <ProductGrid products={products} />
      ) : (
        <p className="py-12 text-center text-gray-500">{t('home.noProducts')}</p>
      )}
      {count > products.length && (
        <div className="mt-8 text-center">
          <Link href={more} className="inline-flex rounded-md bg-forest-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest-700">
            {t('home.viewMore')}
          </Link>
        </div>
      )}
    </>
  );
}

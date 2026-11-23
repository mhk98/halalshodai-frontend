import { Suspense } from 'react';
import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { apiGet, apiGetSafe, qs } from '@/lib/api-server';
import { getT } from '@/lib/i18n';
import { lp, ln } from '@/lib/routes';
import { num } from '@/lib/format';
import { ProductGrid } from '@/components/product/ProductCard';
import Filters, { SortSelect } from './Filters';
import Pagination from './Pagination';
import type { Brand, Category, Lang, PaginationMeta, ProductCard } from '@/types';

export type ListingParams = Record<string, string | undefined>;

const ALLOWED = ['page', 'sort', 'search', 'minPrice', 'maxPrice', 'brand', 'inStock', 'onSale', 'featured', 'bestSeller', 'newArrival', 'combo'];

/** Shared listing for /products, /category/[slug] and search results. */
export default async function ProductListing({ lang, searchParams, category, title, basePath }: {
  lang: Lang;
  searchParams: ListingParams;
  category?: Category | null;
  title: string;
  basePath: string;
}) {
  const t = getT(lang);
  const params: ListingParams = Object.fromEntries(ALLOWED.map((k) => [k, typeof searchParams[k] === 'string' ? searchParams[k] : undefined]));
  const query = qs({ ...params, category: category?.slug, limit: 24 });

  const [res, brands] = await Promise.all([
    apiGet<ProductCard[]>(`/products${query}`, { revalidate: 60 }).catch(() => null),
    apiGetSafe<Brand[]>('/brands', [], { revalidate: 300 }),
  ]);
  const products = res?.data ?? [];
  const meta = res?.meta as PaginationMeta | undefined;
  const children = category?.children ?? [];

  return (
    <div className="container py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
          {meta && <p className="mt-1 text-sm text-gray-500">{t('listing.count', { n: num(meta.total, lang) })}</p>}
        </div>
      </div>

      {children.length > 0 && (
        <div className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
          {children.map((c) => (
            <Link key={c.id} href={lp(lang, `/category/${c.slug}`)} className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-gray-700 shadow-card hover:bg-brand-50 hover:text-brand-700">
              {ln(lang, c.name, c.nameBn)}
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        <Suspense>
          <Filters brands={brands} />
        </Suspense>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-2 lg:justify-end">
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
          {products.length ? (
            <>
              <ProductGrid products={products} priorityCount={4} />
              {meta && <Pagination meta={meta} basePath={basePath} params={params} lang={lang} />}
            </>
          ) : (
            <div className="flex flex-col items-center rounded-xl bg-white py-16 text-center shadow-card">
              <PackageSearch className="h-12 w-12 text-gray-300" />
              <p className="mt-3 font-medium text-gray-700">{t('listing.empty')}</p>
              <p className="mt-1 text-sm text-gray-500">{t('listing.emptyHint')}</p>
              <Link href={lp(lang, '/products')} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">{t('nav.allProducts')}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { Button } from '@/components/ui';
import type { Brand } from '@/types';

const SORTS = ['newest', 'popular', 'price_asc', 'price_desc', 'rating'] as const;

function useUpdateParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp?.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    next.delete('page');
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };
}

export function SortSelect() {
  const { t } = useApp();
  const sp = useSearchParams();
  const update = useUpdateParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-gray-500 sm:inline">{t('listing.sortBy')}</span>
      <select
        value={sp?.get('sort') || 'newest'}
        onChange={(e) => update({ sort: e.target.value === 'newest' ? null : e.target.value })}
        className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-brand-500 focus:outline-none"
      >
        {SORTS.map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
      </select>
    </label>
  );
}

function FilterBody({ brands, onDone }: { brands: Brand[]; onDone?: () => void }) {
  const { t } = useApp();
  const sp = useSearchParams();
  const update = useUpdateParams();
  const [min, setMin] = useState(sp?.get('minPrice') || '');
  const [max, setMax] = useState(sp?.get('maxPrice') || '');
  const selectedBrands = (sp?.get('brand') || '').split(',').filter(Boolean);

  useEffect(() => {
    setMin(sp?.get('minPrice') || '');
    setMax(sp?.get('maxPrice') || '');
  }, [sp]);

  const toggleBrand = (slug: string) => {
    const next = selectedBrands.includes(slug) ? selectedBrands.filter((b) => b !== slug) : [...selectedBrands, slug];
    update({ brand: next.join(',') || null });
  };

  const hasFilters = ['minPrice', 'maxPrice', 'brand', 'inStock', 'onSale'].some((k) => sp?.get(k));

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800">{t('listing.price')}</p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            update({ minPrice: min || null, maxPrice: max || null });
            onDone?.();
          }}
        >
          <div className="flex items-center gap-2">
            {([
              ['min', min, setMin],
              ['max', max, setMax],
            ] as const).map(([key, val, set], i) => (
              <div key={key} className="contents">
                {i === 1 && <span className="h-px w-3 shrink-0 bg-gray-300" aria-hidden />}
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">{t(`listing.${key}`)}</span>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">৳</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder={t(`listing.${key}`)}
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-7 pr-2 text-sm text-gray-800 placeholder:text-xs placeholder:text-gray-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </label>
              </div>
            ))}
          </div>
          <Button type="submit" size="sm" className="w-full">{t('listing.go')}</Button>
        </form>
      </div>

      <div className="space-y-2">
        {(['inStock', 'onSale'] as const).map((k) => (
          <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={sp?.get(k) === 'true'}
              onChange={(e) => update({ [k]: e.target.checked ? 'true' : null })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            {t(`listing.${k}`)}
          </label>
        ))}
      </div>

      {brands.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-800">{t('listing.brands')}</p>
          <div className="space-y-2">
            {brands.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={selectedBrands.includes(b.slug)} onChange={() => toggleBrand(b.slug)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                {b.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <button type="button" onClick={() => { update({ minPrice: null, maxPrice: null, brand: null, inStock: null, onSale: null }); onDone?.(); }} className="text-sm font-medium text-red-600 hover:underline">
          {t('listing.clear')}
        </button>
      )}
    </div>
  );
}

/** Sidebar on desktop, bottom sheet on mobile. */
export default function Filters({ brands }: { brands: Brand[] }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-36 rounded-xl bg-white p-5 shadow-card">
          <p className="mb-4 flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4" />{t('listing.filters')}</p>
          <FilterBody brands={brands} />
        </div>
      </aside>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm lg:hidden">
        <SlidersHorizontal className="h-4 w-4" /> {t('listing.filters')}
      </button>
      <div className={clsx('fixed inset-0 z-50 lg:hidden', !open && 'hidden')}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold">{t('listing.filters')}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('common.close')}><X className="h-5 w-5" /></button>
          </div>
          <FilterBody brands={brands} onDone={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}

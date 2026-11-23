'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ImageOff } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useDebounce } from '@/hooks/useDebounce';
import { API_URL } from '@/lib/api-client';
import { ln } from '@/lib/routes';
import { money } from '@/lib/format';
import { track } from '@/lib/analytics';

interface Suggestions {
  products: { id: number; name: string; nameBn?: string | null; slug: string; price: number; regularPrice: number; image: string | null }[];
  categories: { id: number; name: string; nameBn?: string | null; slug: string }[];
}

/** Search with live suggestions (products + categories). */
export default function SearchBox() {
  const { t, lang, href } = useApp();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Suggestions | null>(null);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(q.trim(), 250);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.length < 1) {
      setData(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`${API_URL}/products/search/suggest?q=${encodeURIComponent(debounced)}&limit=6`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        setData(j.data);
        setActive(-1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (active >= 0 && data?.products[active]) return go(href(`/products/${data.products[active].slug}`));
    if (!term) return;
    track.search(term);
    go(href(`/products?search=${encodeURIComponent(term)}`));
  };

  const onKey = (e: React.KeyboardEvent) => {
    const n = data?.products.length ?? 0;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(n - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === 'Escape') setOpen(false);
  };

  const showPanel = open && q.trim().length >= 1;
  // Typed text not yet sent to the API (debounce) or a request in flight.
  const pending = loading || q.trim() !== debounced;

  return (
    <div ref={box} className="relative w-full">
      <form onSubmit={submit} role="search" className="relative">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          className="block h-11 w-full rounded-md border-0 bg-white pl-4 pr-14 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
        <button type="submit" className="absolute right-1 top-1/2 flex h-9 w-10 -translate-y-1/2 items-center justify-center rounded-md bg-forest-800 text-white hover:bg-forest-700" aria-label={t('search.button')}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>

      {showPanel && !data && pending && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white p-2 shadow-xl" aria-busy="true">
          {[0, 1, 2].map((k) => (
            <div key={k} className="flex animate-pulse items-center gap-3 px-2 py-2">
              <span className="h-12 w-12 shrink-0 rounded-lg bg-gray-100" />
              <span className="flex-1 space-y-2">
                <span className="block h-3 w-2/3 rounded bg-gray-100" />
                <span className="block h-3 w-1/4 rounded bg-gray-100" />
              </span>
            </div>
          ))}
        </div>
      )}

      {showPanel && data && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
          {data.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-gray-100 p-3">
              {data.categories.map((c) => (
                <Link key={c.id} href={href(`/category/${c.slug}`)} onClick={() => setOpen(false)} className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-800 hover:bg-brand-100">
                  {ln(lang, c.name, c.nameBn)}
                </Link>
              ))}
            </div>
          )}
          {data.products.length ? (
            <ul>
              {data.products.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={href(`/products/${p.slug}`)}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 transition hover:bg-brand-50/60 ${i === active ? 'bg-brand-50/60' : ''} ${pending ? 'opacity-60' : ''}`}
                  >
                    {p.image ? (
                      <Image src={p.image} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100"><ImageOff className="h-4 w-4 text-gray-400" /></span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{ln(lang, p.name, p.nameBn)}</span>
                      <span className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-brand-700">{money(p.price, lang)}</span>
                        {p.regularPrice > p.price && <span className="text-xs text-gray-400 line-through">{money(p.regularPrice, lang)}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            pending ? (
              <p className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></p>
            ) : (
              <p className="p-4 text-sm text-gray-500">{t('search.noResults')}</p>
            )
          )}
          <button type="button" onClick={() => go(href(`/products?search=${encodeURIComponent(q.trim())}`))} className="block w-full border-t border-gray-100 p-3 text-center text-sm font-medium text-brand-700 hover:bg-brand-50">
            {t('search.seeAll', { q: q.trim() })}
          </button>
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { num } from '@/lib/format';
import type { Lang, PaginationMeta } from '@/types';

/** Crawlable pagination links that keep the current filters. */
export default function Pagination({ meta, basePath, params, lang }: { meta: PaginationMeta; basePath: string; params: Record<string, string | undefined>; lang: Lang }) {
  if (meta.totalPages <= 1) return null;
  const url = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page') q.set(k, v);
    if (page > 1) q.set('page', String(page));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const pages: (number | '…')[] = [];
  for (let p = 1; p <= meta.totalPages; p += 1) {
    if (p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  const cls = 'flex h-10 min-w-[40px] items-center justify-center rounded-lg px-3 text-sm';
  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      {meta.hasPrev ? <Link href={url(meta.page - 1)} rel="prev" className={clsx(cls, 'bg-white shadow-card hover:bg-brand-50')} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Link> : null}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className={cls}>…</span>
        ) : (
          <Link key={p} href={url(p)} aria-current={p === meta.page ? 'page' : undefined} className={clsx(cls, p === meta.page ? 'bg-brand-600 font-semibold text-white' : 'bg-white shadow-card hover:bg-brand-50')}>
            {num(p, lang)}
          </Link>
        ),
      )}
      {meta.hasNext ? <Link href={url(meta.page + 1)} rel="next" className={clsx(cls, 'bg-white shadow-card hover:bg-brand-50')} aria-label="Next"><ChevronRight className="h-4 w-4" /></Link> : null}
    </nav>
  );
}

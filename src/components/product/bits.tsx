import clsx from 'clsx';
import { Star } from 'lucide-react';
import { money } from '@/lib/format';
import type { Lang } from '@/types';

export function Price({ price, regular, lang, size = 'md' }: { price: number; regular?: number; lang: Lang; size?: 'sm' | 'md' | 'lg' }) {
  const onSale = regular !== undefined && regular > price;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={clsx('font-bold text-brand-700', { sm: 'text-sm', md: 'text-base', lg: 'text-3xl' }[size])}>{money(price, lang)}</span>
      {onSale && <span className={clsx('text-gray-400 line-through', size === 'lg' ? 'text-lg' : 'text-xs')}>{money(regular, lang)}</span>}
    </span>
  );
}

export function Stars({ rating, size = 'sm', className }: { rating: number; size?: 'sm' | 'md'; className?: string }) {
  const s = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <span className={clsx('inline-flex', className)} aria-label={`${rating.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={clsx(s, i <= Math.round(rating) ? 'fill-honey-400 text-honey-400' : 'fill-gray-200 text-gray-200')} />
      ))}
    </span>
  );
}

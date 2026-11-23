'use client';

import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useCartStore } from '@/store/cart';
import { ln } from '@/lib/routes';
import { money } from '@/lib/format';
import type { CartLine } from '@/types';

export function QtyStepper({ value, onChange, max, disabled, size = 'md' }: { value: number; onChange: (v: number) => void; max?: number; disabled?: boolean; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300">
      <button type="button" className={`${s} flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="−">
        <Minus className="h-4 w-4" />
      </button>
      <span className={`${size === 'sm' ? 'w-8' : 'w-10'} text-center text-sm font-semibold`}>{value}</span>
      <button type="button" className={`${s} flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={disabled || (max !== undefined && value >= max)} aria-label="+">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { lang, t, href } = useApp();
  const { update, remove, busy } = useCartStore();
  const safe = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  const pending = line.id < 0; // just added, waiting for the server's id
  const issueText =
    line.issue === 'out_of_stock' ? t('cart.outOfStock') : line.issue === 'unavailable' ? t('cart.unavailable') : line.issue === 'insufficient_stock' ? t('cart.onlyLeft', { n: line.stock }) : null;

  return (
    <li className="flex gap-3 py-4">
      <Link href={line.slug ? href(`/products/${line.slug}`) : '#'} onClick={onNavigate} className="shrink-0">
        <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-gray-50">
          {line.image && <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />}
        </div>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={line.slug ? href(`/products/${line.slug}`) : '#'} onClick={onNavigate} className="line-clamp-2 text-sm font-medium text-gray-800 hover:text-brand-700">
          {ln(lang, line.name, line.nameBn)}
        </Link>
        {line.variantName && <p className="text-xs text-gray-500">{ln(lang, line.variantName, line.variantNameBn)}</p>}
        {issueText && <p className="mt-0.5 text-xs font-medium text-red-600">{issueText}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <QtyStepper size="sm" value={line.quantity} max={line.stock} disabled={busy || pending || line.issue === 'unavailable'} onChange={(q) => safe(() => update(line.id, q))} />
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{money(line.lineTotal, lang)}</p>
            {line.regularPrice > line.unitPrice && <p className="text-xs text-gray-400 line-through">{money(line.regularPrice * line.quantity, lang)}</p>}
          </div>
        </div>
      </div>
      <button type="button" onClick={() => safe(() => remove(line.id))} disabled={busy || pending} className="self-start rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={t('cart.remove')}>
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

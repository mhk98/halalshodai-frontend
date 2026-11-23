'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { BadgeCheck, Star } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useAuthStore } from '@/store/auth';
import { api, ApiError } from '@/lib/api-client';
import { date, num } from '@/lib/format';
import { Button, Spinner, Textarea } from '@/components/ui';
import type { PaginationMeta, Review, ReviewSummary } from '@/types';
import { Stars } from './bits';

function ReviewForm({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { t } = useApp();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 3) return toast.error(t('reviews.tooShort'));
    setBusy(true);
    try {
      const res = await api(`/products/${slug}/reviews`, { method: 'POST', body: { rating, comment: comment.trim() } });
      toast.success(res.message || t('reviews.thanks'));
      setComment('');
      onDone();
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-brand-50/60 p-4">
      <p className="font-semibold text-gray-800">{t('reviews.write')}</p>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} aria-label={`${i} / 5`}>
            <Star className={clsx('h-7 w-7', i <= (hover || rating) ? 'fill-honey-400 text-honey-400' : 'fill-gray-200 text-gray-200')} />
          </button>
        ))}
      </div>
      <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('reviews.placeholder')} maxLength={2000} />
      <Button type="submit" loading={busy}>{t('reviews.submit')}</Button>
    </form>
  );
}

export default function ProductReviews({ slug }: { slug: string }) {
  const { t, lang, href } = useApp();
  const qc = useQueryClient();
  const status = useAuthStore((s) => s.status);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', slug, page],
    queryFn: () => api<Review[]>(`/products/${slug}/reviews?page=${page}&limit=5`),
  });
  const meta = data?.meta as (PaginationMeta & { summary: ReviewSummary }) | undefined;
  const summary = meta?.summary;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div>
        {summary && (
          <div className="rounded-xl bg-white p-5 shadow-card">
            <p className="text-4xl font-bold text-gray-900">{num(Number(summary.avgRating.toFixed(1)), lang)}</p>
            <Stars rating={summary.avgRating} size="md" className="mt-1" />
            <p className="mt-1 text-sm text-gray-500">{t('reviews.basedOn', { n: num(summary.reviewCount, lang) })}</p>
            <div className="mt-4 space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map((r) => {
                const count = summary.breakdown[r] ?? 0;
                const pct = summary.reviewCount ? (count / summary.reviewCount) * 100 : 0;
                return (
                  <div key={r} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-3">{num(r, lang)}</span>
                    <Star className="h-3 w-3 fill-honey-400 text-honey-400" />
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"><span className="block h-full rounded-full bg-honey-400" style={{ width: `${pct}%` }} /></span>
                    <span className="w-6 text-right">{num(count, lang)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-4">
          {status === 'authenticated' ? (
            <ReviewForm slug={slug} onDone={() => qc.invalidateQueries({ queryKey: ['reviews', slug] })} />
          ) : (
            <p className="rounded-xl bg-white p-4 text-sm text-gray-600 shadow-card">
              <Link href={href('/login')} className="font-medium text-brand-700 underline">{t('auth.login')}</Link> {t('reviews.loginToReview')}
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        {isLoading ? (
          <Spinner />
        ) : data?.data.length ? (
          <ul className="space-y-4">
            {data.data.map((r) => (
              <li key={r.id} className="rounded-xl bg-white p-4 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-earth-100 text-sm font-semibold text-earth-700">{r.name[0]}</span>
                    <span className="font-medium text-gray-800">{r.name}</span>
                    {r.isVerifiedPurchase && <span className="inline-flex items-center gap-1 text-xs text-brand-700"><BadgeCheck className="h-3.5 w-3.5" />{t('reviews.verified')}</span>}
                  </div>
                  <span className="text-xs text-gray-500">{date(r.createdAt, lang)}</span>
                </div>
                <Stars rating={r.rating} className="mt-2" />
                {r.title && <p className="mt-2 font-medium text-gray-800">{r.title}</p>}
                <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{r.comment}</p>
                {r.adminReply && <p className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-900"><strong>{t('reviews.storeReply')}:</strong> {r.adminReply}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-card">{t('reviews.none')}</p>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" variant="ghost" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>{t('common.previous')}</Button>
            <Button size="sm" variant="ghost" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
          </div>
        )}
      </div>
    </div>
  );
}

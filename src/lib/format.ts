import type { Lang } from '@/types';

const locale = (lang: Lang) => (lang === 'bn' ? 'bn-BD' : 'en-US');

export const money = (v: number | null | undefined, lang: Lang) =>
  `৳${Number(v ?? 0).toLocaleString(locale(lang), { maximumFractionDigits: 2 })}`;

export const num = (v: number | null | undefined, lang: Lang) => Number(v ?? 0).toLocaleString(locale(lang));

export function date(v: string | Date | null | undefined, lang: Lang, withTime = false) {
  if (!v) return '';
  return new Date(v).toLocaleDateString(locale(lang), {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

/** Strip HTML tags for meta descriptions / excerpts. */
export const plain = (html?: string | null, max = 160) =>
  (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** Bangladeshi mobile: 01[3-9]XXXXXXXX (optional +88). */
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

import type { Lang } from '@/types';

export const LANGS: Lang[] = ['bn', 'en'];
export const DEFAULT_LANG: Lang = 'bn';

export const isLang = (v: string): v is Lang => (LANGS as string[]).includes(v);

/**
 * Locale-aware path. Bangla (default) has no prefix: "/products/x".
 * English is prefixed: "/en/products/x".
 */
export function lp(lang: Lang, path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

/** Strip the locale prefix from a browser path ("/en/cart" → "/cart"). */
export function stripLang(pathname: string) {
  const m = pathname.match(/^\/(en|bn)(\/|$)/);
  return m ? pathname.slice(m[1].length + 1) || '/' : pathname;
}

/** Pick the localized name: Bangla name when browsing in Bangla and available. */
export const ln = (lang: Lang, en: string, bn?: string | null) => (lang === 'bn' && bn ? bn : en);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://halalshodai.xyz').replace(/\/$/, '');
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || '[YOUR_BRAND]';

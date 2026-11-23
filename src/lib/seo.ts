import type { Metadata } from 'next';
import { lp, SITE_URL, SITE_NAME } from './routes';
import type { Lang } from '@/types';

/**
 * Metadata with canonical URL + hreflang alternates for both languages.
 * `path` is the language-neutral path, e.g. "/products/honey".
 */
export function pageMeta({ lang, path, title, description, image, type = 'website', noIndex = false }: {
  lang: Lang;
  path: string;
  title: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'article';
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${lp(lang, path)}`;
  // Every page gets a share image: its own, or the default card (src/app/og-image.png/route.tsx).
  image = image || `${SITE_URL}/og-image.png`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { 'bn-BD': `${SITE_URL}${lp('bn', path)}`, en: `${SITE_URL}${lp('en', path)}`, 'x-default': `${SITE_URL}${lp('bn', path)}` },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: lang === 'bn' ? 'bn_BD' : 'en_US',
      type,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

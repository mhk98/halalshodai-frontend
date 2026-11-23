import type { Metadata } from 'next';
import { getT } from '@/lib/i18n';
import type { Lang } from '@/types';

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  return { title: getT(params.lang)('nav.wishlist'), robots: { index: false, follow: false } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';
import { getT } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import CartView from './CartView';
import type { Lang } from '@/types';

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  return pageMeta({ lang: params.lang, path: '/cart', title: getT(params.lang)('cart.title'), noIndex: true });
}

export default function CartPage() {
  return <CartView />;
}

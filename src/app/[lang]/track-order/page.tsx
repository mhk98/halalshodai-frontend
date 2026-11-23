import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getT } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import TrackOrder from './TrackOrder';
import type { Lang } from '@/types';

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const t = getT(params.lang);
  return pageMeta({ lang: params.lang, path: '/track-order', title: t('nav.trackOrder'), description: t('track.subtitle') });
}

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackOrder />
    </Suspense>
  );
}

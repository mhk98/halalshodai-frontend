import type { Metadata } from 'next';
import ProductListing, { type ListingParams } from '@/components/listing/ProductListing';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getT } from '@/lib/i18n';
import { lp } from '@/lib/routes';
import { pageMeta } from '@/lib/seo';
import type { Lang } from '@/types';

// Depends on ?search, ?page, filters… (fetches are still cached via next.revalidate).
export const dynamic = 'force-dynamic';

export function generateMetadata({ params, searchParams }: { params: { lang: Lang }; searchParams: ListingParams }): Metadata {
  const t = getT(params.lang);
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  return pageMeta({
    lang: params.lang,
    path: '/products',
    title: search ? t('listing.searchTitle', { q: search }) : t('nav.allProducts'),
    description: t('listing.metaDescription'),
    // Search result pages shouldn't be indexed
    noIndex: Boolean(search),
  });
}

export default function ProductsPage({ params, searchParams }: { params: { lang: Lang }; searchParams: ListingParams }) {
  const { lang } = params;
  const t = getT(lang);
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  return (
    <>
      <div className="container pt-6">
        <Breadcrumbs items={[{ label: t('nav.home'), href: lp(lang, '/') }, { label: search ? t('listing.searchTitle', { q: search }) : t('nav.allProducts') }]} />
      </div>
      <ProductListing
        lang={lang}
        searchParams={searchParams}
        title={search ? t('listing.searchTitle', { q: search }) : t('nav.allProducts')}
        basePath={lp(lang, '/products')}
      />
    </>
  );
}

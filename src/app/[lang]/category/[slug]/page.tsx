import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductListing, { type ListingParams } from '@/components/listing/ProductListing';
import Breadcrumbs from '@/components/Breadcrumbs';
import { apiGet } from '@/lib/api-server';
import { getT } from '@/lib/i18n';
import { lp, ln } from '@/lib/routes';
import { pageMeta } from '@/lib/seo';
import type { Category, Lang } from '@/types';

// Depends on filters in the query string; API responses are cached via next.revalidate.
export const dynamic = 'force-dynamic';

const getCategory = (slug: string) => apiGet<Category>(`/categories/${encodeURIComponent(slug)}`, { revalidate: 300 }).catch(() => null);

export async function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Promise<Metadata> {
  const res = await getCategory(params.slug);
  if (!res) return {};
  const c = res.data;
  const name = ln(params.lang, c.name, c.nameBn);
  return pageMeta({
    lang: params.lang,
    path: `/category/${c.slug}`,
    title: c.metaTitle || name,
    description: c.metaDescription || c.description || undefined,
    image: c.image,
  });
}

export default async function CategoryPage({ params, searchParams }: { params: { lang: Lang; slug: string }; searchParams: ListingParams }) {
  const { lang } = params;
  const res = await getCategory(params.slug);
  if (!res) notFound();
  const category = res.data;
  const t = getT(lang);

  return (
    <>
      <div className="container pt-6">
        <Breadcrumbs
          items={[
            { label: t('nav.home'), href: lp(lang, '/') },
            ...(category.breadcrumb ?? []).map((b) => ({ label: ln(lang, b.name, b.nameBn), href: lp(lang, `/category/${b.slug}`) })),
          ]}
        />
      </div>
      <ProductListing
        lang={lang}
        searchParams={searchParams}
        category={category}
        title={ln(lang, category.name, category.nameBn)}
        basePath={lp(lang, `/category/${category.slug}`)}
      />
      {category.description && (
        <section className="container">
          <p className="rounded-xl bg-white p-5 text-sm leading-relaxed text-gray-600 shadow-card">{category.description}</p>
        </section>
      )}
    </>
  );
}

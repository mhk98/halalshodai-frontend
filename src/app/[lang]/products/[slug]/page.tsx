import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Truck, Banknote, RotateCcw } from 'lucide-react';
import { apiGet, apiGetSafe } from '@/lib/api-server';
import { getT } from '@/lib/i18n';
import { lp, ln, SITE_URL } from '@/lib/routes';
import { num, plain } from '@/lib/format';
import { pageMeta } from '@/lib/seo';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import ProductGallery from '@/components/product/ProductGallery';
import ProductPurchase from '@/components/product/ProductPurchase';
import ProductReviews from '@/components/product/ProductReviews';
import { ProductGrid } from '@/components/product/ProductCard';
import { Stars } from '@/components/product/bits';
import { SectionTitle } from '@/components/ui';
import type { Lang, ProductCard, ProductDetail } from '@/types';

export const revalidate = 120;

const getProduct = (slug: string) => apiGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { revalidate: 120 }).catch(() => null);

export async function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Promise<Metadata> {
  const res = await getProduct(params.slug);
  if (!res) return {};
  const p = res.data;
  return {
    ...pageMeta({
      lang: params.lang,
      path: `/products/${p.slug}`,
      title: p.metaTitle || ln(params.lang, p.name, p.nameBn),
      description: p.metaDescription || p.shortDescription || plain(p.description),
      image: p.images[0]?.url,
    }),
    keywords: p.metaKeywords || undefined,
  };
}

export default async function ProductPage({ params }: { params: { lang: Lang; slug: string } }) {
  const { lang } = params;
  const t = getT(lang);
  const res = await getProduct(params.slug);
  if (!res) notFound();
  const p = res.data;
  const related = await apiGetSafe<ProductCard[]>(`/products/${encodeURIComponent(p.slug)}/related`, [], { revalidate: 300 });
  const name = ln(lang, p.name, p.nameBn);
  const url = `${SITE_URL}${lp(lang, `/products/${p.slug}`)}`;

  const prices = p.variants.length ? p.variants.map((v) => v.price) : [p.price];
  const offers =
    p.variants.length > 1
      ? { '@type': 'AggregateOffer', priceCurrency: 'BDT', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: p.variants.length, availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' }
      : { '@type': 'Offer', priceCurrency: 'BDT', price: prices[0], url, availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition' };

  const trust = [
    { icon: ShieldCheck, text: t('trust.natural') },
    { icon: Banknote, text: t('trust.cod') },
    { icon: Truck, text: t('trust.delivery') },
    { icon: RotateCcw, text: t('trust.returns') },
  ];

  return (
    <div className="container py-6">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name,
          sku: p.sku,
          image: p.images.map((i) => i.url),
          description: p.shortDescription || plain(p.description, 300),
          ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand.name } } : {}),
          offers,
          ...(p.reviewCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.avgRating, reviewCount: p.reviewCount } } : {}),
        }}
      />
      <Breadcrumbs
        items={[
          { label: t('nav.home'), href: lp(lang, '/') },
          ...p.breadcrumb.map((b) => ({ label: ln(lang, b.name, b.nameBn), href: lp(lang, `/category/${b.slug}`) })),
          { label: name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={p.images} name={name} discount={p.discountPercent > 0 ? `-${num(p.discountPercent, lang)}%` : undefined} />
        <div>
          {p.brand && <p className="text-sm font-medium uppercase tracking-wide text-earth-600">{p.brand.name}</p>}
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{name}</h1>
          {lang === 'bn' && p.nameBn && <p className="mt-0.5 text-sm text-gray-500">{p.name}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {p.reviewCount > 0 && (
              <a href="#reviews" className="flex items-center gap-1 hover:text-brand-700"><Stars rating={p.avgRating} /> ({num(p.reviewCount, lang)} {t('reviews.reviews')})</a>
            )}
            {p.soldCount > 0 && <span>{t('product.sold', { n: num(p.soldCount, lang) })}</span>}
            {p.sku && <span>SKU: {p.sku}</span>}
          </div>
          {p.shortDescription && <p className="mt-4 leading-relaxed text-gray-700">{p.shortDescription}</p>}
          <div className="mt-6">
            <ProductPurchase product={p} />
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-white p-4 text-sm text-gray-700 shadow-card">
            {trust.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2"><Icon className="h-4 w-4 text-brand-600" />{text}</li>
            ))}
          </ul>
          {p.category && (
            <p className="mt-4 text-sm text-gray-500">
              {t('product.category')}: <Link href={lp(lang, `/category/${p.category.slug}`)} className="text-brand-700 hover:underline">{ln(lang, p.category.name, p.category.nameBn)}</Link>
            </p>
          )}
        </div>
      </div>

      {p.description && (
        <section className="mt-12">
          <SectionTitle title={t('product.description')} />
          {/* Content is authored by store admins in the rich-text editor. */}
          <div className="prose prose-green max-w-none rounded-xl bg-white p-6 shadow-card" dangerouslySetInnerHTML={{ __html: p.description }} />
        </section>
      )}

      <section id="reviews" className="mt-12 scroll-mt-40">
        <SectionTitle title={t('reviews.title')} />
        <ProductReviews slug={p.slug} />
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <SectionTitle title={t('product.related')} />
          <ProductGrid products={related.slice(0, 5)} />
        </section>
      )}
    </div>
  );
}

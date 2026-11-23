import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { FlaskConical, Truck, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { apiGetSafe } from '@/lib/api-server';
import { getSettings } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import { getT } from '@/lib/i18n';
import { lp, ln, SITE_URL, SITE_NAME } from '@/lib/routes';
import HeroSlider from '@/components/home/HeroSlider';
import AllProducts from '@/components/home/AllProducts';
import { CenteredHeading, SideHeading, ViewAllPill } from '@/components/home/SectionHeading';
import { ProductGrid, ProductList } from '@/components/product/ProductCard';
import type { Banner, HomeData, Lang } from '@/types';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { lang: Lang } }): Promise<Metadata> {
  const s = await getSettings();
  const name = s.site_name || SITE_NAME;
  const title = s.meta_title || name;
  const description = s.meta_description;
  // `absolute` so the home title isn't suffixed with "| Site name" by the layout's template.
  return { ...pageMeta({ lang: params.lang, path: '/', title, description, image: s.og_image }), title: { absolute: title } };
}

const EMPTY: HomeData = {
  heroBanners: [], heroSideBanner: null, offerBanners: [], wideBanners: [], popupBanner: null, categories: [],
  bestSellers: [], categorySections: [], newArrivals: [], allProducts: { products: [], total: 0 },
};

/** A banner image (artwork with its own text), linked when it has a link. */
function BannerTile({ banner, lang, aspect, sizes, priority = false, className }: { banner: Banner; lang: Lang; aspect: string; sizes: string; priority?: boolean; className?: string }) {
  const link = banner.link ? (banner.link.startsWith('/') ? lp(lang, banner.link) : banner.link) : null;
  const img = (
    <span className={clsx('relative block overflow-hidden rounded-2xl bg-white', aspect)}>
      <Image src={banner.image} alt={banner.title} fill sizes={sizes} priority={priority} className="object-cover transition duration-500 hover:scale-[1.02]" />
    </span>
  );
  return link ? <Link href={link} className={clsx('block', className)}>{img}</Link> : <div className={className}>{img}</div>;
}

export default async function HomePage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const t = getT(lang);
  const [home, settings] = await Promise.all([apiGetSafe<HomeData>('/home', EMPTY, { revalidate: 60 }), getSettings()]);
  const siteName = settings.site_name || SITE_NAME;

  const trust = [
    { icon: FlaskConical, label: t('trust.labTested') },
    { icon: Truck, label: t('trust.fastDelivery') },
    { icon: RefreshCw, label: t('trust.easyReturn') },
  ];
  const why = [
    { title: t('home.why1'), text: t('home.why1Text') },
    { title: t('home.why2'), text: t('home.why2Text') },
    { title: t('home.why3'), text: t('home.why3Text') },
  ];

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteName,
          url: `${SITE_URL}${lp(lang, '/')}`,
          inLanguage: lang === 'bn' ? 'bn-BD' : 'en',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}${lp(lang, '/products')}?search={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      {/* Hero: slider + side banner, then the trust bar */}
      <section className="container pt-4 sm:pt-5">
        <div className={clsx('grid gap-5', home.heroSideBanner && 'lg:grid-cols-[2fr_1fr]')}>
          <HeroSlider banners={home.heroBanners} />
          {home.heroSideBanner && (
            <BannerTile banner={home.heroSideBanner} lang={lang} aspect="aspect-[545/400] h-full" sizes="(max-width: 1024px) 100vw, 33vw" priority className="hidden lg:block" />
          )}
        </div>
        <ul className="mt-5 grid grid-cols-3 divide-x divide-gray-200 rounded-xl border border-gray-200 bg-white">
          {trust.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-2 px-2 py-4 text-center sm:py-7">
              <Icon className="h-5 w-5 text-gold-600 sm:h-6 sm:w-6" strokeWidth={1.75} />
              <span className="text-xs font-medium text-gray-800 sm:text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Best selling */}
      {home.bestSellers.length > 0 && (
        <section className="mt-5 bg-mint py-12">
          <div className="container">
            <CenteredHeading title={t('home.bestSelling')} />
            <ProductGrid products={home.bestSellers} priorityCount={5} />
          </div>
        </section>
      )}

      {/* Two promo banners */}
      {home.offerBanners.length > 0 && (
        <section className="container grid gap-4 py-5 sm:grid-cols-2">
          {home.offerBanners.slice(0, 2).map((b) => (
            <BannerTile key={b.id} banner={b} lang={lang} aspect="aspect-[692/150]" sizes="(max-width: 640px) 100vw, 50vw" />
          ))}
        </section>
      )}

      {/* One section per featured category, alternating grid (mint) and list (cream) layouts */}
      {home.categorySections.map(({ category, products }, i) => {
        const title = ln(lang, category.name, category.nameBn);
        const more = lp(lang, `/category/${category.slug}`);
        return i % 2 === 0 ? (
          <section key={category.id} className="bg-mint py-12">
            <div className="container">
              <SideHeading title={title} href={more} viewAll={t('common.viewAll')} />
              <ProductGrid products={products.slice(0, 5)} />
            </div>
          </section>
        ) : (
          <section key={category.id} className="py-12">
            <div className="container">
              <CenteredHeading title={title} />
              <ProductList products={products.slice(0, 6)} />
              <ViewAllPill href={more} label={t('common.viewAll')} />
            </div>
          </section>
        );
      })}

      {/* Wide banner(s) */}
      {home.wideBanners.length > 0 && (
        <section className="container space-y-5 pt-6">
          {home.wideBanners.map((b) => (
            <BannerTile key={b.id} banner={b} lang={lang} aspect="aspect-[1400/400]" sizes="100vw" />
          ))}
        </section>
      )}

      {/* New arrivals (list cards) */}
      {home.newArrivals.length > 0 && (
        <section className="py-12">
          <div className="container">
            <CenteredHeading title={t('home.newArrival')} />
            <ProductList products={home.newArrivals.slice(0, 6)} />
          </div>
        </section>
      )}

      {/* All products with category tabs */}
      {home.allProducts.products.length > 0 && (
        <section className="pb-14 pt-4">
          <div className="container">
            <CenteredHeading title={t('home.allProducts')} />
            <AllProducts categories={home.categories} initial={home.allProducts.products} total={home.allProducts.total} />
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="bg-white py-14">
        <div className="container">
          <CenteredHeading title={t('home.why', { name: siteName })} subtitle={t('home.whySub')} />
          <div className="grid gap-5 md:grid-cols-3">
            {why.map((w, i) => (
              <div key={w.title} className="rounded-xl border border-gold-500/25 bg-cream p-6 transition hover:-translate-y-0.5 hover:shadow-card">
                <p className="text-3xl font-bold text-gold-600">{String(i + 1).padStart(2, '0')}</p>
                <span className="my-3 block h-px w-8 bg-gold-500/50" />
                <h3 className="text-lg font-bold text-forest-800">{w.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop call to action */}
      <section className="pt-10">
        <div className="container">
          <div className="flex flex-col gap-6 rounded-2xl bg-gradient-to-r from-forest-800 to-forest-600 p-7 text-white shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-400">
                <ShieldCheck className="h-3.5 w-3.5" /> {t('home.shopCtaBadge')}
              </span>
              <h2 className="mt-3 text-2xl font-bold">{t('home.shopCtaTitle')}</h2>
              <p className="mt-1 text-sm text-white/85">{t('home.shopCtaText')}</p>
            </div>
            <Link href={lp(lang, '/products')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-gold-600 px-7 py-3 font-semibold text-white shadow hover:bg-gold-500">
              {t('home.shopCtaButton')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

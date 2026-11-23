import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ChevronDown, PhoneCall, ShoppingCart } from 'lucide-react';
import { apiGet } from '@/lib/api-server';
import { getCategories, getSettings } from '@/lib/data';
import { getT } from '@/lib/i18n';
import { lp } from '@/lib/routes';
import { plain } from '@/lib/format';
import { pageMeta } from '@/lib/seo';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LandingOrderForm from '@/components/landing/LandingOrderForm';
import LandingTracker from '@/components/landing/LandingTracker';
import type { LandingBackground, LandingPage, LandingSection, Lang } from '@/types';

/** Campaign landing pages built in admin → Marketing → Landing pages. URL: /l/<slug> */
export const revalidate = 60;

const getPage = (slug: string) =>
  /^[a-z0-9-]+$/.test(slug) ? apiGet<LandingPage>(`/landing/${slug}`, { revalidate: 60 }).catch(() => null) : Promise.resolve(null);

export async function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Promise<Metadata> {
  const res = await getPage(params.slug);
  if (!res) return {};
  const p = res.data;
  const hero = p.sections.find((s) => s.type === 'hero');
  const description = p.metaDescription || (hero?.type === 'hero' ? hero.subheading : null) || plain(p.title);
  const image = p.ogImage || (hero?.type === 'hero' ? hero.image : null) || p.products[0]?.product.image || undefined;
  return pageMeta({ lang: params.lang, path: `/l/${p.slug}`, title: p.metaTitle || p.title, description, image });
}

/** YouTube / Facebook link → embeddable player URL (null for anything else). */
function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host.endsWith('youtube.com')) id = u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || null;
    if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    if (host.endsWith('facebook.com') || host === 'fb.watch') return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  } catch {
    /* invalid URL */
  }
  return null;
}

const bgStyle = (bg: LandingBackground | undefined): CSSProperties | undefined =>
  bg === 'dark' ? { background: 'var(--lp)', color: '#fff' } : bg === 'tinted' ? { background: 'color-mix(in srgb, var(--lp) 8%, white)' } : { background: '#fff' };

function Wrap({ s, children, narrow }: { s: LandingSection; children: ReactNode; narrow?: boolean }) {
  return (
    <section style={bgStyle(s.background)} className="py-10 sm:py-14">
      <div className={narrow ? 'container max-w-3xl' : 'container max-w-5xl'}>{children}</div>
    </section>
  );
}

const H2 = ({ children }: { children: ReactNode }) => <h2 className="mb-6 text-center text-2xl font-bold leading-snug sm:text-3xl">{children}</h2>;

function OrderButton({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <a
      href="#order"
      className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold shadow-lg transition hover:scale-[1.03] sm:text-lg ${dark ? 'bg-white text-[var(--lp)]' : 'bg-[var(--lp)] text-white'}`}
    >
      <ShoppingCart className="h-5 w-5" /> {text}
    </a>
  );
}

function Section({ s, orderForm }: { s: LandingSection; orderForm: ReactNode }) {
  const dark = s.background === 'dark';
  switch (s.type) {
    case 'hero':
      return (
        <Wrap s={s}>
          <div className={s.image ? 'grid items-center gap-8 md:grid-cols-2' : 'text-center'}>
            <div className={s.image ? 'text-center md:text-left' : ''}>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{s.heading}</h1>
              {s.subheading && <p className={`mt-4 whitespace-pre-line text-lg ${dark ? 'text-white/85' : 'text-gray-700'}`}>{s.subheading}</p>}
              {s.buttonText && <div className="mt-7"><OrderButton text={s.buttonText} dark={dark} /></div>}
            </div>
            {s.image && <Image src={s.image} alt={s.heading} width={1200} height={1200} priority sizes="(max-width: 768px) 100vw, 50vw" className="h-auto w-full rounded-2xl" />}
          </div>
        </Wrap>
      );
    case 'text':
      return (
        <Wrap s={s} narrow>
          {s.heading && <H2>{s.heading}</H2>}
          {s.body && <div className={`prose max-w-none ${dark ? 'prose-invert' : 'prose-green'}`} dangerouslySetInnerHTML={{ __html: s.body }} />}
        </Wrap>
      );
    case 'image':
      return (
        <Wrap s={s}>
          <figure>
            <Image src={s.image} alt={s.caption || ''} width={1600} height={1200} sizes="(max-width: 1024px) 100vw, 1024px" className="mx-auto h-auto w-full rounded-2xl" />
            {s.caption && <figcaption className="mt-3 text-center text-sm opacity-75">{s.caption}</figcaption>}
          </figure>
        </Wrap>
      );
    case 'video': {
      const src = embedUrl(s.url);
      return (
        <Wrap s={s} narrow>
          {s.heading && <H2>{s.heading}</H2>}
          {src ? (
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-lg">
              <iframe src={src} title={s.heading || 'Video'} className="absolute inset-0 h-full w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          ) : (
            <p className="text-center"><a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{s.url}</a></p>
          )}
        </Wrap>
      );
    }
    case 'features':
      return (
        <Wrap s={s} narrow>
          {s.heading && <H2>{s.heading}</H2>}
          <ul className="grid gap-3 sm:grid-cols-2">
            {s.items.map((item, i) => (
              <li key={i} className={`flex gap-3 rounded-xl p-4 ${dark ? 'bg-white/10' : 'bg-white shadow-card'}`}>
                <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${dark ? 'text-white' : 'text-[var(--lp)]'}`} />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </Wrap>
      );
    case 'gallery':
      return (
        <Wrap s={s}>
          {s.heading && <H2>{s.heading}</H2>}
          <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
            {s.images.map((src, i) => (
              <Image key={i} src={src} alt="" width={800} height={800} sizes="(max-width: 640px) 50vw, 33vw" className="h-auto w-full break-inside-avoid rounded-xl border border-black/5" />
            ))}
          </div>
        </Wrap>
      );
    case 'faq':
      return (
        <Wrap s={s} narrow>
          {s.heading && <H2>{s.heading}</H2>}
          <div className="space-y-3">
            {s.items.map((f, i) => (
              <details key={i} className={`group rounded-xl p-4 ${dark ? 'bg-white/10' : 'bg-white shadow-card'}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  {f.q} <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
                </summary>
                {f.a && <p className={`mt-3 whitespace-pre-line text-sm ${dark ? 'text-white/85' : 'text-gray-700'}`}>{f.a}</p>}
              </details>
            ))}
          </div>
        </Wrap>
      );
    case 'cta':
      return (
        <Wrap s={s} narrow>
          <div className="text-center">
            {s.heading && <h2 className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>}
            {s.text && <p className={`mx-auto mt-3 max-w-2xl whitespace-pre-line ${dark ? 'text-white/85' : 'text-gray-700'}`}>{s.text}</p>}
            {s.buttonText && <div className="mt-6"><OrderButton text={s.buttonText} dark={dark} /></div>}
          </div>
        </Wrap>
      );
    case 'orderForm':
      return <>{orderForm}</>;
  }
}

export default async function LandingPageView({ params }: { params: { lang: Lang; slug: string } }) {
  const { lang } = params;
  const res = await getPage(params.slug);
  if (!res) notFound();
  const page = res.data;
  const options = page.options ?? {};
  const settings = await getSettings();
  const t = getT(lang);
  const hotline = options.hotline || settings.hotline || settings.phone;
  const color = options.primaryColor && /^#[0-9a-f]{6}$/i.test(options.primaryColor) ? options.primaryColor : '#136a3a';
  const logo = settings.logo;
  const siteName = settings.site_name || 'Store';
  const first = page.products[0]?.product;

  const orderForm = (
    <section key="order" id="order" className="scroll-mt-4 bg-gray-50 py-10 sm:py-14">
      <div className="container">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">{options.orderFormTitle || t('landing.orderFormTitle')}</h2>
        {options.notice && <p className="mx-auto mb-6 w-fit rounded-full bg-[var(--lp)] px-4 py-1.5 text-center text-sm font-semibold text-white">{options.notice}</p>}
        {!options.notice && <div className="mb-6" />}
        <LandingOrderForm pageId={page.id} products={page.products} options={options} />
      </div>
    </section>
  );
  const hasForm = page.sections.some((s) => s.type === 'orderForm');

  return (
    <div style={{ '--lp': color } as CSSProperties} className="-mb-12">
      <LandingTracker pageId={page.id} item={first ? { id: first.id, name: first.name, price: first.price } : undefined} />

      {options.showSiteHeader ? (
        <Header lang={lang} settings={settings} categories={await getCategories()} />
      ) : (
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
          <div className="container flex h-14 items-center justify-between gap-3">
            <Link href={lp(lang, '/')} aria-label={siteName} className="flex items-center">
              {logo ? <Image src={String(logo)} alt={siteName} width={160} height={48} className="h-9 w-auto" priority /> : <span className="text-lg font-bold">{siteName}</span>}
            </Link>
            <div className="flex items-center gap-2">
              {hotline && (
                <a href={`tel:${hotline}`} className="hidden items-center gap-1.5 rounded-full border border-[var(--lp)] px-3 py-1.5 text-sm font-semibold text-[var(--lp)] sm:inline-flex">
                  <PhoneCall className="h-4 w-4" /> {hotline}
                </a>
              )}
              <a href="#order" className="rounded-full bg-[var(--lp)] px-4 py-1.5 text-sm font-bold text-white">{t('landing.orderNow')}</a>
            </div>
          </div>
        </header>
      )}

      {page.sections.map((s) => <Section key={s.id} s={s} orderForm={orderForm} />)}
      {!hasForm && orderForm}

      {hotline && (
        <section className="bg-white py-8 text-center">
          <p className="text-gray-600">{t('landing.callHelp')}</p>
          <a href={`tel:${hotline}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--lp)] px-6 py-3 text-lg font-bold text-white">
            <PhoneCall className="h-5 w-5" /> {hotline}
          </a>
        </section>
      )}

      {options.showSiteHeader ? (
        <Footer lang={lang} settings={settings} categories={[]} />
      ) : (
        <footer className="border-t border-gray-100 bg-white py-5 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {siteName}
        </footer>
      )}

      {/* Mobile: order button always in reach */}
      <a href="#order" className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-center gap-2 rounded-full bg-[var(--lp)] py-3 font-bold text-white shadow-xl sm:hidden">
        <ShoppingCart className="h-5 w-5" /> {t('landing.orderNow')}
      </a>
    </div>
  );
}

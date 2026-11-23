import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Hind_Siliguri, Inter } from 'next/font/google';
import '../globals.css';
import Providers from '@/components/providers/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import FloatingChat from '@/components/layout/FloatingChat';
import CartDrawer from '@/components/cart/CartDrawer';
import FloatingCart from '@/components/cart/FloatingCart';
import SiteChrome from '@/components/layout/SiteChrome';
import Analytics from '@/components/Analytics';
import JsonLd from '@/components/JsonLd';
import { getCategories, getSettings } from '@/lib/data';
import { isLang, LANGS, SITE_URL, SITE_NAME } from '@/lib/routes';
import { pageMeta } from '@/lib/seo';
import type { Lang } from '@/types';

const bnFont = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-bn', display: 'swap' });
const enFont = Inter({ subsets: ['latin'], variable: '--font-en', display: 'swap' });

export const viewport: Viewport = { themeColor: '#136a3a', width: 'device-width', initialScale: 1 };

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = (isLang(params.lang) ? params.lang : 'bn') as Lang;
  const s = await getSettings();
  const name = s.site_name || SITE_NAME;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: s.meta_title || name, template: `%s | ${name}` },
    applicationName: name,
    icons: { icon: s.favicon ? String(s.favicon) : '/favicon.svg' },
    ...pageMeta({ lang, path: '/', title: s.meta_title || name, description: s.meta_description, image: s.og_image }),
  };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  if (!isLang(params.lang)) notFound();
  const lang = params.lang as Lang;
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const name = settings.site_name || SITE_NAME;

  return (
    <html lang={lang === 'bn' ? 'bn' : 'en'} className={`${bnFont.variable} ${enFont.variable}`}>
      <body className="flex min-h-screen flex-col">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name,
            url: SITE_URL,
            ...(settings.logo ? { logo: settings.logo } : {}),
            ...(settings.hotline || settings.phone ? { contactPoint: { '@type': 'ContactPoint', telephone: settings.hotline || settings.phone, contactType: 'customer service', areaServed: 'BD' } } : {}),
            sameAs: [settings.facebook, settings.instagram, settings.youtube].filter(Boolean),
          }}
        />
        <Providers lang={lang} settings={settings}>
          {/* Landing pages (/l/…) render their own slim header: the shop chrome is skipped there. */}
          <SiteChrome><Header lang={lang} settings={settings} categories={categories} /></SiteChrome>
          <main className="flex-1 pb-12">{children}</main>
          <SiteChrome>
            <Footer lang={lang} settings={settings} categories={categories} />
            <CartDrawer />
            <FloatingCart />
          </SiteChrome>
          <FloatingChat />
          <SiteChrome><MobileBottomNav /></SiteChrome>
        </Providers>
        <Analytics
          gaId={(settings.ga4_measurement_id as string) || process.env.NEXT_PUBLIC_GA4_ID}
          pixelId={settings.fb_pixel_enabled === false ? undefined : (settings.facebook_pixel_id as string) || process.env.NEXT_PUBLIC_FB_PIXEL_ID}
          tiktokPixelId={settings.tiktok_pixel_enabled === false ? undefined : (settings.tiktok_pixel_id as string) || undefined}
          googleAds={
            settings.gads_enabled === true && settings.gads_conversion_id
              ? {
                  id: String(settings.gads_conversion_id),
                  enhanced: settings.gads_enhanced_conversions !== false,
                  labels: {
                    purchase: (settings.gads_label_purchase as string) || undefined,
                    addToCart: (settings.gads_label_add_to_cart as string) || undefined,
                    beginCheckout: (settings.gads_label_begin_checkout as string) || undefined,
                    lead: (settings.gads_label_lead as string) || undefined,
                    signUp: (settings.gads_label_sign_up as string) || undefined,
                  },
                }
              : null
          }
          serverEvents={settings.fb_capi_enabled === true || settings.tiktok_events_enabled === true}
        />
      </body>
    </html>
  );
}

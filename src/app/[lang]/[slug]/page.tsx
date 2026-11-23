import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { apiGet } from '@/lib/api-server';
import { getSettings } from '@/lib/data';
import { getT } from '@/lib/i18n';
import { lp } from '@/lib/routes';
import { plain } from '@/lib/format';
import { pageMeta } from '@/lib/seo';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Lang, StaticPage } from '@/types';

/** CMS pages managed in admin → Static pages (about, contact, privacy-policy, terms, return-policy, …). */
export const revalidate = 600;

const getPage = (slug: string) => (/^[a-z0-9-]+$/.test(slug) ? apiGet<StaticPage>(`/pages/${slug}`, { revalidate: 600 }).catch(() => null) : Promise.resolve(null));

export async function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Promise<Metadata> {
  const res = await getPage(params.slug);
  if (!res) return {};
  const p = res.data;
  return pageMeta({ lang: params.lang, path: `/${p.slug}`, title: p.metaTitle || p.title, description: p.metaDescription || plain(p.content) });
}

export default async function StaticPageView({ params }: { params: { lang: Lang; slug: string } }) {
  const { lang } = params;
  const res = await getPage(params.slug);
  if (!res) notFound();
  const p = res.data;
  const t = getT(lang);
  const settings = p.slug === 'contact' ? await getSettings() : null;
  const address = settings ? (lang === 'bn' ? settings.address_bn || settings.address : settings.address) : null;

  return (
    <div className="container max-w-4xl py-6">
      <Breadcrumbs items={[{ label: t('nav.home'), href: lp(lang, '/') }, { label: p.title }]} />
      <h1 className="text-3xl font-bold text-gray-900">{p.title}</h1>
      <div className="prose prose-green mt-6 max-w-none rounded-xl bg-white p-6 shadow-card" dangerouslySetInnerHTML={{ __html: p.content || '' }} />

      {settings && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(settings.hotline || settings.phone) && (
            <a href={`tel:${settings.hotline || settings.phone}`} className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-card hover:bg-brand-50">
              <Phone className="h-6 w-6 text-brand-600" />
              <span><span className="block text-sm text-gray-500">{t('header.hotline')}</span><span className="font-semibold">{settings.hotline || settings.phone}</span></span>
            </a>
          )}
          {settings.email && (
            <a href={`mailto:${settings.email}`} className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-card hover:bg-brand-50">
              <Mail className="h-6 w-6 text-brand-600" />
              <span><span className="block text-sm text-gray-500">{t('checkout.email')}</span><span className="font-semibold">{settings.email}</span></span>
            </a>
          )}
          {address && (
            <div className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-card">
              <MapPin className="h-6 w-6 shrink-0 text-brand-600" />
              <span><span className="block text-sm text-gray-500">{t('contact.address')}</span><span className="font-semibold">{address}</span></span>
            </div>
          )}
          {settings.business_hours && (
            <div className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-card">
              <Clock className="h-6 w-6 text-brand-600" />
              <span><span className="block text-sm text-gray-500">{t('contact.hours')}</span><span className="font-semibold">{settings.business_hours}</span></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

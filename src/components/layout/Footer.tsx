import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Youtube, Mail, MapPin, PhoneCall } from 'lucide-react';
import { getT } from '@/lib/i18n';
import { lp } from '@/lib/routes';
import { WhatsAppIcon } from '@/components/icons';
import ConsultLink from '@/components/ConsultLink';
import type { Category, Lang, Settings } from '@/types';

export default function Footer({ lang, settings }: { lang: Lang; settings: Settings; categories: Category[] }) {
  const t = getT(lang);
  const siteName = settings.site_name || 'Store';
  const logo = settings.logo_dark || settings.logo;
  const address = lang === 'bn' ? settings.address_bn || settings.address : settings.address;
  const phone = settings.hotline || settings.phone;
  const whatsapp = String(settings.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const social = [
    { href: settings.facebook, icon: <Facebook className="h-4 w-4" />, label: 'Facebook' },
    { href: whatsapp ? `https://wa.me/${whatsapp}` : undefined, icon: <WhatsAppIcon className="h-4 w-4" />, label: 'WhatsApp' },
    { href: settings.instagram, icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
    { href: settings.youtube, icon: <Youtube className="h-4 w-4" />, label: 'YouTube' },
  ].filter((s) => s.href);

  const columns: { title: string; links: { label: string; href: string; external?: boolean; lead?: boolean }[] }[] = [
    {
      title: t('footer.quickLinks'),
      links: [
        { label: t('footer.allProducts'), href: lp(lang, '/products') },
        { label: t('nav.cart'), href: lp(lang, '/cart') },
        { label: t('nav.blog'), href: lp(lang, '/blog') },
      ],
    },
    {
      title: t('footer.usefulLinks'),
      links: [
        { label: t('footer.about'), href: lp(lang, '/about') },
        { label: t('footer.privacy'), href: lp(lang, '/privacy-policy') },
        { label: t('footer.terms'), href: lp(lang, '/terms') },
        { label: t('footer.returnPolicy'), href: lp(lang, '/return-policy') },
      ],
    },
    {
      title: t('footer.helpCenter'),
      links: [
        { label: t('nav.trackOrder'), href: lp(lang, '/track-order') },
        { label: t('footer.contact'), href: lp(lang, '/contact') },
        { label: t('header.account'), href: lp(lang, '/account') },
        { label: t('nav.wishlist'), href: lp(lang, '/wishlist') },
      ],
    },
  ];

  return (
    <footer className="pb-16 lg:pb-0">
      {/* Question strip */}
      <div className="bg-forest-900 text-white">
        <div className="container flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold">{t('footer.askTitle')}</p>
            <p className="text-sm text-white/75">{t('footer.askText')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {phone && (
              <a href={`tel:${phone}`} className="inline-flex items-center gap-2 rounded-md bg-gold-600 px-5 py-2.5 text-sm font-semibold hover:bg-gold-500">
                <PhoneCall className="h-4 w-4" /> {phone}
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-gold-600 px-5 py-2.5 text-sm font-semibold hover:bg-gold-500">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="border-t border-white/10 bg-forest-800 text-white">
        <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.3fr]">
          <div>
            <Link href={lp(lang, '/')} aria-label={siteName} className="inline-block">
              {logo ? <Image src={logo} alt={siteName} width={192} height={192} className="h-24 w-auto rounded-lg" /> : <span className="text-2xl font-bold">{siteName}</span>}
            </Link>
            {social.length > 0 && (
              <div className="mt-5 flex gap-2">
                {social.map((s) => (
                  <a key={s.label} href={s.href as string} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 hover:border-gold-400 hover:text-gold-400">
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 font-bold">{col.title}</p>
              <ul className="space-y-3 text-sm text-white/80">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.lead ? (
                      <ConsultLink href={l.href} className="hover:text-gold-400">{l.label}</ConsultLink>
                    ) : l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-gold-400">{l.label}</a>
                    ) : (
                      <Link href={l.href} className="hover:text-gold-400">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="mb-4 font-bold">{t('footer.contactUs')}</p>
            <ul className="space-y-3 text-sm text-white/80">
              {phone && (
                <li className="flex gap-2.5"><PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /><a href={`tel:${phone}`} className="font-bold text-white hover:text-gold-400">{phone}</a></li>
              )}
              {address && <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /><span>{address}</span></li>}
              {settings.email && <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /><a href={`mailto:${settings.email}`} className="hover:text-gold-400">{settings.email}</a></li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="container py-4 text-center text-xs text-white/70">© {new Date().getFullYear()} {siteName}. {t('footer.rights')}</p>
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-white">
        <div className="container py-4">
          {settings.payment_banner ? (
            <span className="relative block h-16 w-full sm:h-24">
              <Image src={String(settings.payment_banner)} alt={t('footer.payWith')} fill sizes="(max-width: 640px) 100vw, 1200px" className="object-contain" />
            </span>
          ) : (
            <>
              {/* Official SSLCommerz "Pay With" banner — wide strip on desktop, stacked grid on mobile */}
              <Image
                src="/images/payment/sslcommerz-pay-with.png"
                alt={`${t('footer.payWith')} — Verified by SSLCommerz`}
                width={5235}
                height={586}
                sizes="(max-width: 1400px) 100vw, 1400px"
                className="hidden h-auto w-full sm:block"
              />
              <Image
                src="/images/payment/sslcommerz-pay-with-mobile.png"
                alt={`${t('footer.payWith')} — Verified by SSLCommerz`}
                width={3678}
                height={1784}
                sizes="100vw"
                className="h-auto w-full sm:hidden"
              />
            </>
          )}
        </div>
      </div>
    </footer>
  );
}

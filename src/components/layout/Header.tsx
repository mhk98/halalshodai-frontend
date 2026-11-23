import Link from 'next/link';
import Image from 'next/image';
import { trimmedLogo } from '@/lib/logo';
import { ChevronDown } from 'lucide-react';
import { getT } from '@/lib/i18n';
import { lp, ln } from '@/lib/routes';
import type { Category, Lang, Settings } from '@/types';
import SearchBox from './SearchBox';
import HeaderActions from './HeaderActions';
import MobileMenu from './MobileMenu';
import LangSwitcher from './LangSwitcher';

/**
 * Dark green bar (logo, search, Order Track / Sign In / Cart / More) over a darker category bar.
 * The logo on the dark bar is `logo_dark` from settings (a light version of the logo), else `logo`.
 */
export default function Header({ lang, settings, categories }: { lang: Lang; settings: Settings; categories: Category[] }) {
  const t = getT(lang);
  const siteName = settings.site_name || 'Store';
  const logo = settings.logo_dark || settings.logo;

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="bg-forest-800">
        <div className="container flex h-16 items-center gap-3 sm:h-[72px] sm:gap-6">
          <MobileMenu categories={categories} />
          <Link href={lp(lang, '/')} className="flex shrink-0 items-center" aria-label={siteName}>
            {logo ? (
              <span className="flex items-center rounded-xl bg-cream px-2 py-1 shadow-md ring-2 ring-gold-500/70">
                <Image src={trimmedLogo(logo)} alt={siteName} width={160} height={127} className="h-10 w-auto sm:h-[52px]" priority />
              </span>
            ) : (
              <span className="text-xl font-bold tracking-wide text-white">{siteName}</span>
            )}
          </Link>
          <div className="mx-auto hidden w-full max-w-3xl flex-1 md:block">
            <SearchBox />
          </div>
          <HeaderActions />
          <MobileMenu categories={categories} variant="more" />
        </div>
        <div className="container pb-3 md:hidden">
          <SearchBox />
        </div>
      </div>

      {/* Category bar (desktop) */}
      <nav className="hidden bg-forest-900 lg:block" aria-label={t('nav.categories')}>
        <ul className="container flex h-12 items-center gap-1 text-[15px] text-white">
          {categories.map((c) => (
            <li key={c.id} className="group relative">
              <Link href={lp(lang, `/category/${c.slug}`)} className="flex items-center gap-1 rounded-md px-3 py-2 font-medium hover:bg-white/10 hover:text-gold-400">
                {ln(lang, c.name, c.nameBn)}
                {c.children.length > 0 && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
              </Link>
              {c.children.length > 0 && (
                <div className="invisible absolute left-0 top-full z-50 min-w-[200px] translate-y-1 rounded-xl border border-gray-100 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {c.children.map((ch) => (
                    <Link key={ch.id} href={lp(lang, `/category/${ch.slug}`)} className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-mint hover:text-forest-800">
                      {ln(lang, ch.name, ch.nameBn)}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
          <li className="ml-auto">
            <LangSwitcher className="rounded-md px-3 py-2 text-sm text-white/80" />
          </li>
        </ul>
      </nav>
    </header>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ChevronDown, Menu, X, Truck, Heart, User, Phone, BookOpen, Info, Mail } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { ln } from '@/lib/routes';
import type { Category } from '@/types';
import LangSwitcher from './LangSwitcher';

/**
 * Slide-out menu with every category and the secondary links.
 *  variant="menu": hamburger on the left of the header, mobile and tablet only.
 *  variant="more": the "More" button on the right of the header, desktop only; opens from the right.
 */
export default function MobileMenu({ categories, variant = 'menu' }: { categories: Category[]; variant?: 'menu' | 'more' }) {
  const { t, lang, href, settings } = useApp();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {variant === 'menu' ? (
        <button type="button" onClick={() => setOpen(true)} className="-ml-2 rounded-lg p-2 text-white hover:bg-white/10 lg:hidden" aria-label={t('nav.menu')}>
          <Menu className="h-6 w-6" />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="hidden flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-white hover:bg-white/10 lg:flex" aria-label={t('header.more')}>
          <Menu className="h-6 w-6" />
          <span className="text-xs">{t('header.more')}</span>
        </button>
      )}
      {open && (
        <div className={clsx('fixed inset-0 z-50', variant === 'menu' && 'lg:hidden')}>
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setOpen(false)} />
          <aside className={clsx('absolute inset-y-0 flex w-[85%] max-w-sm flex-col bg-white shadow-xl', variant === 'more' ? 'right-0 animate-slide-in' : 'left-0 animate-slide-in-left')}>
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="font-semibold text-brand-800">{t('nav.categories')}</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-gray-100" aria-label={t('common.close')}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              <Link href={href('/products')} className="block border-b px-4 py-3 font-medium text-gray-800">{t('nav.allProducts')}</Link>
              {categories.map((c) => (
                <div key={c.id} className="border-b">
                  <div className="flex items-center">
                    <Link href={href(`/category/${c.slug}`)} className="flex-1 px-4 py-3 text-gray-800">{ln(lang, c.name, c.nameBn)}</Link>
                    {c.children.length > 0 && (
                      <button type="button" onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="px-4 py-3 text-gray-500" aria-label="Expand">
                        <ChevronDown className={`h-4 w-4 transition ${expanded === c.id ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {expanded === c.id && (
                    <div className="bg-gray-50 pb-2">
                      {c.children.map((ch) => (
                        <Link key={ch.id} href={href(`/category/${ch.slug}`)} className="block px-8 py-2 text-sm text-gray-700">{ln(lang, ch.name, ch.nameBn)}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="space-y-1 p-4 text-sm">
                <Link href={href('/track-order')} className="flex items-center gap-2 py-2 text-gray-700"><Truck className="h-4 w-4" />{t('nav.trackOrder')}</Link>
                <Link href={href('/wishlist')} className="flex items-center gap-2 py-2 text-gray-700"><Heart className="h-4 w-4" />{t('nav.wishlist')}</Link>
                <Link href={href('/account')} className="flex items-center gap-2 py-2 text-gray-700"><User className="h-4 w-4" />{t('header.account')}</Link>
                <Link href={href('/blog')} className="flex items-center gap-2 py-2 text-gray-700"><BookOpen className="h-4 w-4" />{t('nav.blog')}</Link>
                <Link href={href('/about')} className="flex items-center gap-2 py-2 text-gray-700"><Info className="h-4 w-4" />{t('footer.about')}</Link>
                <Link href={href('/contact')} className="flex items-center gap-2 py-2 text-gray-700"><Mail className="h-4 w-4" />{t('footer.contact')}</Link>
                {(settings.hotline || settings.phone) && (
                  <a href={`tel:${settings.hotline || settings.phone}`} className="flex items-center gap-2 py-2 text-gray-700"><Phone className="h-4 w-4" />{settings.hotline || settings.phone}</a>
                )}
              </div>
            </nav>
            <div className="border-t p-4 text-sm">
              <LangSwitcher className="text-forest-800 hover:!text-gold-700" />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

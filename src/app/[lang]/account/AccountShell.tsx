'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { User, Package, MapPin, Heart, LogOut } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';
import { useAuthStore } from '@/store/auth';
import { useAuthActions } from '@/hooks/useAuthActions';
import { stripLang } from '@/lib/routes';
import { PageSpinner } from '@/components/ui';

/** Client-side guard + navigation for /account/* (data is per-user, so not server-rendered). */
export default function AccountShell({ children }: { children: React.ReactNode }) {
  const { t, href } = useApp();
  const router = useRouter();
  const path = stripLang(usePathname() || '/');
  const { status, user } = useAuthStore();
  const { logout } = useAuthActions();

  useEffect(() => {
    if (status === 'guest') router.replace(href(`/login?next=${encodeURIComponent(path)}`));
  }, [status, router, href, path]);

  if (status !== 'authenticated') return <PageSpinner />;

  const links = [
    { to: '/account', label: t('account.profile'), icon: User, exact: true },
    { to: '/account/orders', label: t('account.orders'), icon: Package },
    { to: '/account/addresses', label: t('account.addresses'), icon: MapPin },
    { to: '/wishlist', label: t('nav.wishlist'), icon: Heart },
  ];

  return (
    <div className="container py-8">
      <div className="grid gap-6 lg:grid-cols-4">
        <aside className="h-fit rounded-xl bg-white p-4 shadow-card">
          <div className="mb-3 border-b pb-3">
            <p className="text-xs text-gray-500">{t('header.hello')}</p>
            <p className="font-semibold text-gray-900">{user?.name}</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {links.map((l) => {
              const active = l.exact ? path === l.to : path.startsWith(l.to);
              return (
                <Link key={l.to} href={href(l.to)} className={clsx('flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm', active ? 'bg-brand-50 font-medium text-brand-800' : 'text-gray-700 hover:bg-gray-50')}>
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              );
            })}
            <button type="button" onClick={logout} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> {t('auth.logout')}
            </button>
          </nav>
        </aside>
        <div className="min-w-0 lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}

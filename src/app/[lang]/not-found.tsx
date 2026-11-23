'use client';

import Link from 'next/link';
import { Sprout } from 'lucide-react';
import { useApp } from '@/components/providers/Providers';

export default function NotFound() {
  const { t, href } = useApp();
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <Sprout className="h-16 w-16 text-brand-300" />
      <p className="mt-4 text-5xl font-bold text-brand-700">404</p>
      <h1 className="mt-2 text-xl font-semibold">{t('error.notFound')}</h1>
      <p className="mt-1 text-gray-600">{t('error.notFoundText')}</p>
      <div className="mt-6 flex gap-3">
        <Link href={href('/')} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">{t('nav.home')}</Link>
        <Link href={href('/products')} className="rounded-lg border border-brand-600 px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50">{t('nav.allProducts')}</Link>
      </div>
    </div>
  );
}

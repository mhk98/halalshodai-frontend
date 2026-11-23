'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/providers/Providers';
import { lp, stripLang } from '@/lib/routes';

/**
 * Links to the same page in the other language. The query string is appended on
 * click (reading it during render would need a Suspense boundary on static pages).
 */
export default function LangSwitcher({ className = '' }: { className?: string }) {
  const { lang } = useApp();
  const pathname = usePathname();
  const other = lang === 'bn' ? 'en' : 'bn';
  const target = lp(other, stripLang(pathname || '/'));
  return (
    <Link
      href={target}
      hrefLang={other}
      prefetch={false}
      className={`font-medium hover:text-white ${className}`}
      onClick={(e) => {
        if (window.location.search) {
          e.preventDefault();
          window.location.href = target + window.location.search;
        }
      }}
    >
      {other === 'en' ? 'English' : 'বাংলা'}
    </Link>
  );
}

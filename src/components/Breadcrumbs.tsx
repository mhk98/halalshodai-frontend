import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import JsonLd from './JsonLd';
import { SITE_URL } from '@/lib/routes';

/** Visible breadcrumb + BreadcrumbList JSON-LD. `href` values are locale-aware paths. */
export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
              {it.href && i < items.length - 1 ? (
                <Link href={it.href} className="hover:text-brand-700">{it.label}</Link>
              ) : (
                <span className="text-gray-700" aria-current={i === items.length - 1 ? 'page' : undefined}>{it.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.label,
            ...(it.href ? { item: `${SITE_URL}${it.href}` } : {}),
          })),
        }}
      />
    </>
  );
}

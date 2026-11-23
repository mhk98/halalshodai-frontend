import Link from 'next/link';
import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';

/** Gold underline used under every home section title. */
const Rule = ({ center }: { center?: boolean }) => <span className={clsx('mt-3 block h-[3px] w-12 rounded-full bg-gold-600', center && 'mx-auto')} />;

/** Centered title (Best Selling, Honey, New Arrival…) with an optional subtitle. */
export function CenteredHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-2xl font-bold text-forest-800 sm:text-[28px]">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
      <Rule center />
    </div>
  );
}

/** Left title with "View All →" on the right (category sections). */
export function SideHeading({ title, href, viewAll }: { title: string; href?: string; viewAll: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-forest-800 sm:text-2xl">{title}</h2>
        <Rule />
      </div>
      {href && (
        <Link href={href} className="mb-3 flex shrink-0 items-center gap-1 text-sm font-medium text-forest-800 hover:text-gold-700">
          {viewAll} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** Outlined pill "View All →" under list sections. */
export function ViewAllPill({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-8 text-center">
      <Link href={href} className="inline-flex items-center gap-1 rounded-full border border-forest-800 px-5 py-2 text-sm font-medium text-forest-800 transition hover:bg-forest-800 hover:text-white">
        {label} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

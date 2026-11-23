import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { apiGet, qs } from '@/lib/api-server';
import { getT } from '@/lib/i18n';
import { lp } from '@/lib/routes';
import { date } from '@/lib/format';
import { pageMeta } from '@/lib/seo';
import Breadcrumbs from '@/components/Breadcrumbs';
import Pagination from '@/components/listing/Pagination';
import type { BlogPost, Lang, PaginationMeta } from '@/types';

// Depends on ?page and ?tag (fetches are still cached via next.revalidate).
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const t = getT(params.lang);
  return pageMeta({ lang: params.lang, path: '/blog', title: t('nav.blog'), description: t('blog.subtitle') });
}

export default async function BlogPage({ params, searchParams }: { params: { lang: Lang }; searchParams: { page?: string; tag?: string } }) {
  const { lang } = params;
  const t = getT(lang);
  const res = await apiGet<BlogPost[]>(`/blog${qs({ page: searchParams.page, tag: searchParams.tag })}`, { revalidate: 300 }).catch(() => null);
  const posts = res?.data ?? [];

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: t('nav.home'), href: lp(lang, '/') }, { label: t('nav.blog') }]} />
      <h1 className="text-2xl font-bold sm:text-3xl">{t('nav.blog')}{searchParams.tag && <span className="text-brand-700"> · #{searchParams.tag}</span>}</h1>
      <p className="mt-1 text-gray-600">{t('blog.subtitle')}</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <article key={p.id} className="group overflow-hidden rounded-xl bg-white shadow-card">
            <Link href={lp(lang, `/blog/${p.slug}`)} className="relative block aspect-[1200/630] bg-gray-100">
              {p.coverImage && <Image src={p.coverImage} alt={p.title} fill priority={i < 3} sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition group-hover:scale-105" />}
            </Link>
            <div className="p-5">
              <p className="text-xs text-gray-500">{date(p.publishedAt, lang)}{p.author && ` · ${p.author.name}`}</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-brand-700"><Link href={lp(lang, `/blog/${p.slug}`)}>{p.title}</Link></h2>
              {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-gray-600">{p.excerpt}</p>}
              {!!p.tags?.length && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.tags.map((tag) => <Link key={tag} href={lp(lang, `/blog?tag=${encodeURIComponent(tag)}`)} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-800 hover:bg-brand-100">#{tag}</Link>)}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      {!posts.length && <p className="py-12 text-center text-gray-500">{t('blog.empty')}</p>}
      {res?.meta && <Pagination meta={res.meta as PaginationMeta} basePath={lp(lang, '/blog')} params={{ tag: searchParams.tag }} lang={lang} />}
    </div>
  );
}

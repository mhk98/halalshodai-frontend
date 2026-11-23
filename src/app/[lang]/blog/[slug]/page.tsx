import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiGet } from '@/lib/api-server';
import { getT } from '@/lib/i18n';
import { lp, SITE_URL } from '@/lib/routes';
import { date, plain } from '@/lib/format';
import { pageMeta } from '@/lib/seo';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import type { BlogPost, Lang } from '@/types';

export const revalidate = 300;

const getPost = (slug: string) => apiGet<BlogPost>(`/blog/${encodeURIComponent(slug)}`, { revalidate: 300 }).catch(() => null);

export async function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Promise<Metadata> {
  const res = await getPost(params.slug);
  if (!res) return {};
  const p = res.data;
  return pageMeta({ lang: params.lang, path: `/blog/${p.slug}`, title: p.metaTitle || p.title, description: p.metaDescription || p.excerpt || plain(p.content), image: p.coverImage, type: 'article' });
}

export default async function BlogPostPage({ params }: { params: { lang: Lang; slug: string } }) {
  const { lang } = params;
  const t = getT(lang);
  const res = await getPost(params.slug);
  if (!res) notFound();
  const p = res.data;

  return (
    <article className="container max-w-3xl py-6">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: p.title,
          datePublished: p.publishedAt,
          image: p.coverImage ? [p.coverImage] : undefined,
          author: p.author ? { '@type': 'Person', name: p.author.name } : undefined,
          mainEntityOfPage: `${SITE_URL}${lp(lang, `/blog/${p.slug}`)}`,
        }}
      />
      <Breadcrumbs items={[{ label: t('nav.home'), href: lp(lang, '/') }, { label: t('nav.blog'), href: lp(lang, '/blog') }, { label: p.title }]} />
      <h1 className="text-3xl font-bold leading-tight text-gray-900">{p.title}</h1>
      <p className="mt-2 text-sm text-gray-500">{date(p.publishedAt, lang)}{p.author && ` · ${p.author.name}`}</p>
      {p.coverImage && (
        <div className="relative mt-6 aspect-[1200/630] overflow-hidden rounded-2xl">
          <Image src={p.coverImage} alt={p.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}
      {/* Authored by store admins in the rich-text editor. */}
      <div className="prose prose-green mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: p.content || '' }} />
      {!!p.related?.length && (
        <aside className="mt-12 border-t pt-8">
          <h2 className="mb-4 text-lg font-semibold">{t('blog.related')}</h2>
          <ul className="space-y-3">
            {p.related.map((r) => (
              <li key={r.id}><Link href={lp(lang, `/blog/${r.slug}`)} className="font-medium text-brand-700 hover:underline">{r.title}</Link></li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}

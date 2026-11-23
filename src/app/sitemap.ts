import type { MetadataRoute } from 'next';
import { apiGetSafe } from '@/lib/api-server';
import { lp, SITE_URL } from '@/lib/routes';
import type { BlogPost, Category, ProductCard } from '@/types';

export const revalidate = 3600;

const STATIC_PAGES = ['about', 'contact', 'privacy-policy', 'terms', 'return-policy'];

function flatten(nodes: Category[]): Category[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);
}

/** Both languages for every URL, with hreflang alternates. */
function entry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], lastModified?: string | null): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${lp('bn', path)}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    changeFrequency,
    priority,
    alternates: { languages: { 'bn-BD': `${SITE_URL}${lp('bn', path)}`, en: `${SITE_URL}${lp('en', path)}` } },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, posts] = await Promise.all([
    apiGetSafe<Category[]>('/categories', [], { revalidate: 3600 }),
    apiGetSafe<BlogPost[]>('/blog?limit=100', [], { revalidate: 3600 }),
  ]);

  // Products: page through the public listing (100 per page, up to 50 pages).
  const products: ProductCard[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const batch = await apiGetSafe<ProductCard[]>(`/products?limit=100&page=${page}`, [], { revalidate: 3600 });
    products.push(...batch);
    if (batch.length < 100) break;
  }

  return [
    entry('/', 1, 'daily'),
    entry('/products', 0.9, 'daily'),
    entry('/blog', 0.6, 'weekly'),
    ...flatten(categories).map((c) => entry(`/category/${c.slug}`, 0.8, 'daily')),
    ...products.map((p) => entry(`/products/${p.slug}`, 0.8, 'weekly')),
    ...posts.map((p) => entry(`/blog/${p.slug}`, 0.5, 'monthly', p.publishedAt)),
    ...STATIC_PAGES.map((s) => entry(`/${s}`, 0.3, 'yearly')),
  ];
}

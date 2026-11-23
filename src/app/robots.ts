import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/routes';

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ['/cart', '/checkout', '/account', '/login', '/register', '/forgot-password', '/wishlist'];
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: [...privatePaths, ...privatePaths.map((p) => `/en${p}`)] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

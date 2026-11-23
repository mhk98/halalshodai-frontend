import { NextResponse, type NextRequest } from 'next/server';

/**
 * Locale routing without a prefix for the default language:
 *   /products/x      → internally rewritten to /bn/products/x  (Bangla, default)
 *   /en/products/x   → served as-is                             (English)
 *   /bn/products/x   → 308 redirect to /products/x              (one canonical URL)
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === '/en' || pathname.startsWith('/en/')) return NextResponse.next();

  if (pathname === '/bn' || pathname.startsWith('/bn/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || '/';
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/bn${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes and files with an extension (images, robots.txt, sitemap.xml…)
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';

/**
 * On-demand ISR revalidation, called by the backend after admin changes
 * (backend env: STOREFRONT_REVALIDATE_URL=https://shop.example.com/api/revalidate + REVALIDATE_SECRET).
 */
export const dynamic = 'force-dynamic';

function validSecret(given: string | null) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!validSecret(req.headers.get('x-revalidate-secret'))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  // Every page is under the [lang] root layout; revalidating it refreshes the whole store.
  revalidatePath('/[lang]', 'layout');
  revalidatePath('/sitemap.xml');
  revalidatePath('/og-image.png'); // default share image follows site name / og_image changes
  return NextResponse.json({ success: true, revalidatedAt: new Date().toISOString() });
}

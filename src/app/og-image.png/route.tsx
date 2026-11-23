import { ImageResponse } from 'next/og';
import { getSettings } from '@/lib/data';
import { SITE_NAME } from '@/lib/routes';

/**
 * Default Open Graph image (1200×630) for pages that have no image of their own: listings,
 * static pages, products without photos. pageMeta() points og:image here when no image is given.
 * If admin → Settings → SEO has a share image, this redirects to it; otherwise it draws a
 * branded card. The path has a file extension, so the locale middleware leaves it alone.
 */
export const revalidate = 3600;

// The built-in font only covers Latin script; Bangla text would render as boxes.
const latin = (s?: string | null) => (s && /^[\x20-\x7E]+$/.test(s) ? s : undefined);

export async function GET() {
  const s = await getSettings();
  if (s.og_image) return Response.redirect(String(s.og_image), 307);

  const name = latin(s.site_name) || SITE_NAME;
  const tagline = latin(s.site_tagline);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: 'linear-gradient(135deg, #0d3a22 0%, #136a3a 55%, #237d4c 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', width: 96, height: 8, borderRadius: 4, background: '#f5b83d', marginBottom: 40 }} />
        <div style={{ display: 'flex', fontSize: 88, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{name}</div>
        {tagline && <div style={{ display: 'flex', marginTop: 28, fontSize: 40, color: '#e0efdd', lineHeight: 1.3 }}>{tagline}</div>}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

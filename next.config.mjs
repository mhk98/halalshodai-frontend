/**
 * Image hosts allowed for next/image come from NEXT_IMAGE_ORIGINS (comma-separated origins),
 * e.g. "https://placehold.co,https://api.halalshodai.xyz,https://cdn.example.com".
 */
const origins = (process.env.NEXT_IMAGE_ORIGINS || 'https://placehold.co,https://api.halalshodai.xyz,https://res.cloudinary.com')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const remotePatterns = origins.map((origin) => {
  const u = new URL(origin);
  return { protocol: u.protocol.replace(':', ''), hostname: u.hostname, port: u.port || '', pathname: '/**' };
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    // Uploaded files get random names and are never overwritten, so optimized copies can be kept for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // placehold.co serves SVG for some sizes; allow it safely for demo images.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;

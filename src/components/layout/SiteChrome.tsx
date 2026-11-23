'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Landing pages (/l/<slug>, /en/l/<slug>) bring their own slim header, so the shop's chrome is hidden there. */
export const isLandingPath = (pathname: string | null) => !!pathname && /^\/(?:en\/|bn\/)?l\//.test(pathname);

export default function SiteChrome({ children }: { children: ReactNode }) {
  return isLandingPath(usePathname()) ? null : <>{children}</>;
}

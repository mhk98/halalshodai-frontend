'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { track } from '@/lib/analytics';

/** Link to the Hakim consultation (WhatsApp / contact page) that records a Meta "Lead" when clicked. */
export default function ConsultLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  const external = href.startsWith('http');
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} onClick={() => track.lead('Hakim consultation')} {...rest}>
      {children}
    </a>
  );
}

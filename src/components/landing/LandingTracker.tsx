'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api-client';
import { track } from '@/lib/analytics';

/** Counts the visit (admin → Landing pages → Visits) and sends ViewContent for the first product. */
export default function LandingTracker({ pageId, item }: { pageId: number; item?: { id: number; name: string; price: number } }) {
  useEffect(() => {
    const key = `lp-view:${pageId}`;
    try {
      if (sessionStorage.getItem(key)) return; // once per visit, not per reload
      sessionStorage.setItem(key, '1');
    } catch {
      /* storage unavailable: count anyway */
    }
    api(`/landing/${pageId}/view`, { method: 'POST' }).catch(() => {});
    if (item) track.viewItem(item);
  }, [pageId, item]);
  return null;
}
